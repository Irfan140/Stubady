import { Redirect } from "expo-router";

import { LoadingState } from "@/components/ui";
import { useIsSignedIn } from "@/lib/auth-client";

// Initial route — kept as a branded splash so the hop from native splash
// to the guarded (auth)/(app) stacks never flashes a blank screen.
// Pure JS: safe for EAS Update (OTA, no new build).
export default function Index() {
  const { isSignedIn, isPending } = useIsSignedIn();

  if (isPending) return <LoadingState label="Opening your study space..." />;

  return <Redirect href={isSignedIn ? "/(app)/(tabs)" : "/(auth)/sign-in"} />;
}
