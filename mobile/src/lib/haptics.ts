import * as Haptics from "expo-haptics";

function run(feedback: () => Promise<void>) {
  try {
    void feedback().catch(() => undefined);
  } catch {
    // Haptics are best-effort — never break a press handler.
  }
}

export function hapticSelection() {
  run(() => Haptics.selectionAsync());
}

export function hapticLight() {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticMedium() {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function hapticSuccess() {
  run(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
}

export function hapticWarning() {
  run(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  );
}

export function hapticError() {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
