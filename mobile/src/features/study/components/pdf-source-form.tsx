import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MAX_PDF_SIZE_BYTES } from "@/constants/uploads.constants";
import {
  uploadFileToPresignedUrl,
  isUploadCancelled,
} from "@/lib/storage/upload";
import { useTheme } from "@/stores/theme-store";
import type { Palette } from "@/theme";
import { useCompletePdfUpload, useCreatePdfUpload } from "../api";
import { Button } from "@/components/ui";

type UploadStatus =
  "picking" | "preparing" | "uploading" | "processing" | "error";

const STATUS_LABEL: Record<UploadStatus, string> = {
  picking: "Choose a PDF to upload…",
  preparing: "Preparing your PDF for upload…",
  uploading: "Uploading your PDF…",
  processing: "Processing your PDF…",
  error: "Upload failed",
};

export function PdfSourceForm({
  studySetId,
  autoOpen = false,
  onDone,
  onClose,
}: {
  studySetId: string;
  autoOpen?: boolean;
  onDone: () => void;
  onClose: () => void;
}) {
  const createUpload = useCreatePdfUpload();
  const completeUpload = useCompletePdfUpload(studySetId);
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const started = useRef(false);
  const abortUpload = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Abandon a stuck upload if the form unmounts mid-flight.
  useEffect(() => () => abortUpload.current?.abort(), []);

  const selectAndUpload = useCallback(async () => {
    setError(null);
    setProgress(null);
    setStatus("picking");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) {
        onClose();
        return;
      }

      const asset = result.assets[0];
      const file = new File(asset.uri);
      const size = asset.size ?? file.size;
      if (!size || size > MAX_PDF_SIZE_BYTES) {
        throw new Error("Choose a PDF between 1 byte and 25 MB.");
      }

      setStatus("preparing");
      const session = await createUpload.mutateAsync({
        studySetId,
        fileName: asset.name,
        contentType: "application/pdf",
        size,
      });

      setStatus("uploading");
      const controller = new AbortController();
      abortUpload.current = controller;
      await uploadFileToPresignedUrl({
        fileUri: asset.uri,
        uploadUrl: session.uploadUrl,
        contentType: "application/pdf",
        signal: controller.signal,
        onProgress: ({ loaded, total }) => {
          setProgress(total > 0 ? loaded / total : null);
        },
      });
      abortUpload.current = null;

      setStatus("processing");
      await completeUpload.mutateAsync(session.source.id);
      onDone();
    } catch (uploadError) {
      abortUpload.current = null;
      // User-cancelled: close silently instead of showing an error card.
      if (isUploadCancelled(uploadError)) {
        onClose();
        return;
      }
      setStatus("error");
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "PDF upload failed. Please try again.",
      );
    }
  }, [completeUpload, createUpload, onClose, onDone, studySetId]);

  useEffect(() => {
    if (autoOpen && !started.current) {
      started.current = true;
      void selectAndUpload();
    }
  }, [autoOpen, selectAndUpload]);

  if (status === null) {
    return (
      <View style={styles.idle}>
        <Button title="Choose PDF" onPress={() => void selectAndUpload()} />
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorText} selectable>
          {error}
        </Text>
        <View style={styles.errorActions}>
          <View style={styles.errorFlex}>
            <Button
              title="Try again"
              variant="secondary"
              onPress={() => void selectAndUpload()}
            />
          </View>
          <View style={styles.errorFlex}>
            <Button title="Close" variant="secondary" onPress={onClose} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.progress}>
      <ActivityIndicator color={palette.primary} size="small" />
      <Text style={styles.statusText}>
        {STATUS_LABEL[status]}
        {status === "uploading" && progress != null
          ? ` ${Math.round(progress * 100)}%`
          : ""}
      </Text>
      {status === "uploading" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel upload"
          hitSlop={8}
          onPress={() => abortUpload.current?.abort()}
          style={styles.cancel}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    idle: { gap: 8 },
    progress: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 56,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: palette.pool,
    },
    statusText: {
      color: palette.ink,
      fontSize: 14,
      fontWeight: "600",
      flexShrink: 1,
      flex: 1,
    },
    cancel: {
      paddingHorizontal: 8,
      paddingVertical: 10,
      minHeight: 44,
      justifyContent: "center",
    },
    cancelText: { color: palette.muted, fontSize: 13, fontWeight: "700" },
    errorCard: { gap: 10 },
    errorText: { color: palette.danger, fontSize: 14, lineHeight: 20 },
    errorActions: { flexDirection: "row", gap: 8 },
    errorFlex: { flex: 1 },
  });
