import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  Button,
  ErrorState,
  LoadingState,
  styles as ui,
} from "@/components/ui";
import { useDeck } from "@/features/study/api";

export default function Deck() {
  const { id, studySetId } = useLocalSearchParams<{
    id: string;
    studySetId: string;
  }>();
  const query = useDeck(studySetId, id);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const rotation = useSharedValue(0);
  // so one continuous flip never exposes the next card's answer.
  const applyCard = (nextIndex: number) => {
    setIndex(nextIndex);
    setRevealed(false);
  };

  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearPendingSwap = () => {
    if (swapTimer.current) {
      clearTimeout(swapTimer.current);
      swapTimer.current = null;
    }
  };
  useEffect(
    () => () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    },
    [],
  );

  const flip = () => {
    clearPendingSwap();
    const next = !revealed;
    setRevealed(next);
    cancelAnimation(rotation);
    rotation.value = withTiming(next ? 180 : 0, { duration: 420 });
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }],
    opacity: interpolate(rotation.value, [0, 90, 180], [1, 0, 0]),
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotation.value + 180}deg` },
    ],
    opacity: interpolate(rotation.value, [0, 90, 180], [0, 0, 1]),
  }));

  if (query.isPending) return <LoadingState label="Loading flashcards…" />;
  if (query.isError) return <ErrorState message={query.error.message} />;
  if (!query.data.cards.length)
    return <ErrorState message="This deck has no cards yet." />;

  const cards = query.data.cards;
  const cardIndex = Math.min(index, cards.length - 1);
  const card = cards[cardIndex]; // then flip open onto the new question. The swap runs on the JS thread at
  // the deterministic phase-1 duration — no UI-thread worklet callbacks,
  // which clash with React Compiler-transformed functions.
  const changeCard = (nextIndex: number) => {
    clearPendingSwap();
    cancelAnimation(rotation);
    const distance = Math.abs(rotation.value - 90);
    const phaseOneMs = Math.max(80, Math.round(distance * 2));
    rotation.value = withTiming(90, {
      duration: phaseOneMs,
      easing: Easing.in(Easing.quad),
    });
    swapTimer.current = setTimeout(() => {
      swapTimer.current = null;
      applyCard(nextIndex);
      rotation.value = withTiming(0, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
    }, phaseOneMs);
  };
  const nextCard = () =>
    changeCard(cardIndex === cards.length - 1 ? 0 : cardIndex + 1);
  const previousCard = () => changeCard(Math.max(0, cardIndex - 1));

  return (
    <View style={[ui.screen, ui.content]}>
      <Stack.Screen options={{ title: query.data.title }} />
      <Text style={styles.progress}>
        {cardIndex + 1} / {cards.length}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={revealed ? "Show question" : "Show answer"}
        onPress={flip}
        style={styles.cardContainer}
      >
        <Animated.View style={[styles.cardFace, frontStyle]}>
          <Text style={styles.label}>QUESTION</Text>
          <Text selectable style={styles.cardText}>
            {card.front}
          </Text>
          <Text style={ui.muted}>Tap to reveal answer</Text>
        </Animated.View>
        <Animated.View style={[styles.cardFace, styles.backFace, backStyle]}>
          <Text style={styles.label}>ANSWER</Text>
          <Text selectable style={styles.cardText}>
            {card.back}
          </Text>
          <Text style={ui.muted}>Tap to show question</Text>
        </Animated.View>
      </Pressable>
      <View style={styles.actions}>
        <Button
          title="Previous"
          variant="secondary"
          disabled={cardIndex === 0}
          onPress={previousCard}
        />
        <Button
          title={cardIndex === cards.length - 1 ? "Restart" : "Next"}
          onPress={nextCard}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { color: "#4F46E5", fontWeight: "800", textAlign: "center" },
  cardContainer: { minHeight: 260, position: "relative" },
  cardFace: {
    position: "absolute",
    inset: 0,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backfaceVisibility: "hidden",
    justifyContent: "center",
  },
  backFace: { backgroundColor: "#EFF6FF" },
  label: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  cardText: {
    color: "#0F172A",
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    minHeight: 120,
  },
  actions: { flexDirection: "row", gap: 10 },
});
