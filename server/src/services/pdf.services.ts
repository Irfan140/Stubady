import { GetObjectCommand } from "@aws-sdk/client-s3";
import { PDFParse } from "pdf-parse";

import { PROVIDER_TIMEOUTS } from "../config/constants";
import { r2Client, r2Config } from "../lib/r2";
import { withTimeout } from "../utils/async.utils";

export const extractPdfText = async (storagePath: string): Promise<string> => {
  const response = await withTimeout(
    r2Client.send(
      new GetObjectCommand({ Bucket: r2Config.bucketName, Key: storagePath }),
    ),
    PROVIDER_TIMEOUTS.r2Ms,
    "PDF download timed out",
  );

  if (!response.Body) throw new Error("R2 returned an empty PDF object");

  const bytes = await response.Body.transformToByteArray();
  const parser = new PDFParse({ data: Buffer.from(bytes) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
};
