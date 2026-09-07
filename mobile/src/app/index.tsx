import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";

import { LoadingState } from "@/components/ui";

// Initial route — kept as a branded splash so the hop from native splash
// to the guarded (auth)/(app) stacks never flashes a blank screen.
// Pure JS: safe for EAS Update (OTA, no new build).
export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <LoadingState label="Opening your study space..." />;

  return <Redirect href={isSignedIn ? "/(app)/(tabs)" : "/(auth)/sign-in"} />;
}
