import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../config/env";

export const R2_UPLOAD_EXPIRES_SECONDS = 15 * 60;
export const R2_DOWNLOAD_EXPIRES_SECONDS = 15 * 60;
export const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;

export const r2Config = {
  bucketName: env.r2BucketName,
  endpoint: env.r2Endpoint,
} as const;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: env.r2Endpoint,
  forcePathStyle: false,
  credentials: {
    accessKeyId: env.r2AccessKeyId,
    secretAccessKey: env.r2SecretAccessKey,
  },
});

export const userStoragePrefix = (userId: string): string => `users/${userId}/`;

export const createPdfUploadUrl = async (input: {
  key: string;
}): Promise<string> =>
  getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: input.key,
      ContentType: "application/pdf",
    }),
    { expiresIn: R2_UPLOAD_EXPIRES_SECONDS },
  );

export const headObject = async (key: string) =>
  r2Client.send(
    new HeadObjectCommand({ Bucket: r2Config.bucketName, Key: key }),
  );

export const deleteObject = async (key: string): Promise<void> => {
  await r2Client.send(
    new DeleteObjectCommand({ Bucket: r2Config.bucketName, Key: key }),
  );
};

export const deleteObjectsByPrefix = async (prefix: string): Promise<void> => {
  let continuationToken: string | undefined;
  do {
    const page = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: r2Config.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    const objects = (page.Contents ?? [])
      .filter((object): object is { Key: string } => Boolean(object.Key))
      .map((object) => ({ Key: object.Key }));

    // Use the single-object delete API for R2 compatibility. It avoids the
    // batch DeleteObjects checksum requirements and still safely handles
    // every object under the prefix.
    const failures: string[] = [];
    for (const object of objects) {
      try {
        await deleteObject(object.Key);
      } catch {
        failures.push(object.Key);
      }
    }
    if (failures.length > 0) {
      throw new Error(`Failed to delete ${failures.length} R2 object(s)`);
    }
    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
  } while (continuationToken);
};
