import type { Response } from "express";

const openStreams = new Set<Response>();

export const registerStream = (res: Response): void => {
  openStreams.add(res);
  res.on("close", () => {
    openStreams.delete(res);
  });
};

export const endAllStreams = (): void => {
  for (const res of openStreams) {
    try {
      if (!res.writableEnded) res.end();
    } catch {
      // already destroyed
    }
  }
  openStreams.clear();
};
