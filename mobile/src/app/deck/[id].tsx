import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Button, ErrorState, LoadingState, useUiStyles } from "@/components/ui";
import { useDeck } from "@/features/study/api";
import { useTheme } from "@/stores/theme-store";
import type { Palette } from "@/theme";

export default function Deck() {
  const { palette } = useTheme();
  const ui = useUiStyles();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const { id, studySetId } = useLocalSearchParams<{
    id: string;
    studySetId: string;
  }>();
  const query = useDeck(studySetId, id);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  // Natural content heights of both faces. The container takes the taller
  // one so short cards stay compact while the flip always overlaps exactly.
  const [faceHeights, setFaceHeights] = useState({ front: 0, back: 0 });
  const onFaceLayout =
    (face: "front" | "back") =>
    ({ nativeEvent }: LayoutChangeEvent) => {
      const { height } = nativeEvent.layout;
      setFaceHeights((prev) =>
        prev[face] === height ? prev : { ...prev, [face]: height },
      );
    };
  const contentHeight = Math.max(faceHeights.front, faceHeights.back);
  const rotation = useSharedValue(0);
  // Box height lives on the UI thread so it morphs smoothly when moving
  // between cards of different lengths instead of jumping.
  const boxHeight = useSharedValue(0);
  useEffect(() => {
    if (contentHeight > 0) {
      boxHeight.value = withTiming(contentHeight, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [contentHeight, boxHeight]);
  const boxAnimatedStyle = useAnimatedStyle(() => ({
    height: boxHeight.value,
    minHeight: boxHeight.value > 0 ? 0 : 200,
  }));
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
    rotation.value = withTiming(next ? 180 : 0, {
      duration: 550,
      easing: Easing.inOut(Easing.cubic),
    });
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
        style={styles.cardCenter}
      >
        <Animated.View style={[styles.cardBox, boxAnimatedStyle]}>
          <Animated.View
            style={[styles.cardFace, styles.frontFace, frontStyle]}
          >
            <View onLayout={onFaceLayout("front")} style={styles.faceContent}>
              <Text style={[styles.label, styles.questionLabel]}>QUESTION</Text>
              <Text selectable style={styles.cardText}>
                {card.front}
              </Text>
              <Text style={ui.muted}>Tap to reveal answer</Text>
            </View>
          </Animated.View>
          <Animated.View style={[styles.cardFace, styles.backFace, backStyle]}>
            <View onLayout={onFaceLayout("back")} style={styles.faceContent}>
              <Text style={[styles.label, styles.answerLabel]}>ANSWER</Text>
              <Text selectable style={styles.cardText}>
                {card.back}
              </Text>
              <Text style={ui.muted}>Tap to show question</Text>
            </View>
          </Animated.View>
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

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    progress: {
      color: palette.primary,
      fontWeight: "800",
      textAlign: "center",
    },
    cardCenter: { flex: 1, justifyContent: "center" },
    // Height is driven by boxAnimatedStyle (smooth morph between cards).
    // minHeight here is only the pre-measurement floor so the card paints
    // immediately on platforms that clip overflow of zero-height boxes.
    cardBox: { position: "relative", width: "100%", minHeight: 200 },
    faceContent: { gap: 14, width: "100%" },
    cardFace: {
      position: "absolute",
      inset: 0,
      borderRadius: 18,
      padding: 18,
      gap: 14,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      backfaceVisibility: "hidden",
      justifyContent: "center",
    },
    backFace: { backgroundColor: palette.successSoft },
    frontFace: { backgroundColor: palette.primarySoft },
    label: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
    questionLabel: { color: palette.primary },
    answerLabel: { color: palette.success },
    cardText: {
      color: palette.ink,
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "700",
    },
    actions: { flexDirection: "row", gap: 10 },
  });
