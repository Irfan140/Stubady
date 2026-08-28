import { Firecrawl } from "firecrawl";

import { env } from "../config/env";
import { PROVIDER_TIMEOUTS } from "../config/constants";
import { withTimeout } from "../utils/async.utils";

export const fetchWebText = async (url: string): Promise<string> => {
  const firecrawl = new Firecrawl({ apiKey: env.firecrawlApiKey });
  const result = await withTimeout(
    firecrawl.scrape(url, {
      formats: ["markdown"],
      onlyMainContent: true,
    }),
    PROVIDER_TIMEOUTS.firecrawlMs,
    "Web source processing timed out",
  );

  const markdown = result.markdown?.trim();
  if (!markdown) throw new Error("Firecrawl returned no content for url");
  return markdown;
};
