import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { uploadFileToPresignedUrl } from "@/lib/storage/upload";
import { useCompletePdfUpload, useCreatePdfUpload } from "../api";

const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;

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
  const insets = useSafeAreaInsets();
  const started = useRef(false);
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectAndUpload = useCallback(async () => {
    setError(null);
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
      await uploadFileToPresignedUrl({
        fileUri: asset.uri,
        uploadUrl: session.uploadUrl,
        contentType: "application/pdf",
      });

      setStatus("processing");
      await completeUpload.mutateAsync(session.source.id);
      onDone();
    } catch (uploadError) {
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

  if (status === null) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { bottom: Math.max(insets.bottom, 16) + 8 }]}
    >
      <View style={[styles.card, status === "error" && styles.cardError]}>
        {status === "error" ? (
          <>
            <Text style={styles.errorText} selectable>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss upload error"
              onPress={onClose}
              style={styles.dismiss}
            >
              <Text style={styles.dismissText}>Close</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.statusText}>{STATUS_LABEL[status]}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", left: 16, right: 16, alignItems: "center" },
  card: {
    width: "100%",
    maxWidth: 480,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.35)",
  },
  cardError: { backgroundColor: "#7F1D1D" },
  statusText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  errorText: { color: "#FECACA", fontSize: 13, lineHeight: 18, flex: 1 },
  dismiss: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  dismissText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
