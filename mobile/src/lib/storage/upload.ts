import { File } from "expo-file-system";

export async function uploadFileToPresignedUrl(input: {
  fileUri: string;
  uploadUrl: string;
  contentType: string;
}): Promise<void> {
  const file = new File(input.fileUri);
  const response = await fetch(input.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": input.contentType },
    body: await file.arrayBuffer(),
  });

  if (!response.ok) {
    throw new Error(`File upload failed (${response.status})`);
  }
}
