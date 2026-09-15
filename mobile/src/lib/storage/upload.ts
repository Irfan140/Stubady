import {
  createUploadTask,
  FileSystemSessionType,
  FileSystemUploadType,
  type FileSystemUploadResult,
} from "expo-file-system/legacy";

export type UploadProgress = {
  loaded: number;
  total: number;
};

export const isUploadCancelled = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

const cancelledError = (): Error => {
  const error = new Error("Upload cancelled");
  error.name = "AbortError";
  return error;
};

/**
 * Streams a file to a presigned PUT URL natively — bytes never enter the JS
 * heap, so a 25 MB PDF can't OOM the app — with progress and cancellation.
 * Same native module the app already ships (no new deps, OTA-safe).
 */
export async function uploadFileToPresignedUrl(input: {
  fileUri: string;
  uploadUrl: string;
  contentType: string;
  signal?: AbortSignal;
  onProgress?: (progress: UploadProgress) => void;
}): Promise<void> {
  if (input.signal?.aborted) throw cancelledError();

  const task = createUploadTask(
    input.uploadUrl,
    input.fileUri,
    {
      httpMethod: "PUT",
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      sessionType: FileSystemSessionType.FOREGROUND,
      headers: { "Content-Type": input.contentType },
    },
    (data) => {
      input.onProgress?.({
        loaded: data.totalBytesSent,
        total: data.totalBytesExpectedToSend,
      });
    },
  );

  let onAbort: (() => void) | undefined;
  try {
    const result = await new Promise<FileSystemUploadResult | null | undefined>(
      (resolve, reject) => {
        onAbort = () => {
          task.cancelAsync().catch(() => undefined);
          reject(cancelledError());
        };
        input.signal?.addEventListener("abort", onAbort, { once: true });
        task.uploadAsync().then(resolve, reject);
      },
    );
    if (!result || result.status < 200 || result.status >= 300) {
      throw new Error(`File upload failed (${result?.status ?? "unknown"})`);
    }
  } finally {
    if (onAbort) input.signal?.removeEventListener("abort", onAbort);
  }
}
