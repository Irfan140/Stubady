import { Stack, useLocalSearchParams, router } from "expo-router";
import { useEffect } from "react";
import { ErrorState, LoadingState } from "@/components/ui";
import { useConversation } from "@/features/study/api";

export default function NewChat() {
  const { studySetId } = useLocalSearchParams<{ studySetId: string }>();
  const { mutate, status, data, isError, error } = useConversation(studySetId);
  useEffect(() => {
    if (studySetId && status === "idle") mutate();
  }, [mutate, status, studySetId]);
  useEffect(() => {
    if (data?.id)
      router.replace({
        pathname: "/chat/[id]",
        params: { id: data.id, studySetId },
      });
  }, [data, studySetId]);
  return (
    <>
      <Stack.Screen options={{ title: "Study chat" }} />
      {isError ? (
        <ErrorState message={error.message} onRetry={() => mutate()} />
      ) : (
        <LoadingState label="Opening your study chat…" />
      )}
    </>
  );
}
