import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { Button, TextField, useUiStyles } from "@/components/ui";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/stores/theme-store";
import { radius, type } from "@/theme";
import type { Palette } from "@/theme";

const emailSchema = z.object({ email: z.email("Enter a valid email address") });
const codeSchema = z.object({
  code: z.string().trim().min(4, "Enter the verification code"),
});
const passwordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters"),
});
type Step = "email" | "code" | "password";

const steps: { id: Step; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "code", label: "Code" },
  { id: "password", label: "New password" },
];

export default function ForgotPassword() {
  const { palette, isDark } = useTheme();
  const ui = useUiStyles();
  const styles = React.useMemo(() => makeStyles(palette), [palette]);
  const insets = useSafeAreaInsets();
  const [step, setStep] = React.useState<Step>("email");
  const [error, setError] = React.useState<string | null>(null);
  // Email + code travel together: the final reset call needs both.
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetCode, setResetCode] = React.useState("");
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });
  const message = (value: unknown) => {
    const anyErr = value as { message?: string; code?: string };
    const code = (anyErr?.code ?? "") as string;
    const raw = (anyErr?.message ?? "") as string;
    const lower = `${code} ${raw}`.toLowerCase();
    if (lower.includes("credential") || lower.includes("no password")) {
      return "This email can’t receive a password reset code that way. If it was created with Google, use “Continue with Google” or contact support.";
    }
    if (
      code === "INVALID_OTP" ||
      code === "EXPIRED_OTP" ||
      lower.includes("otp")
    ) {
      return "That code didn’t work. Check it and try again, or go back and resend.";
    }
    if (raw) return raw;
    if (value instanceof Error) return value.message;
    return "Password reset failed. Please try again.";
  };

  const sendCode = async ({ email }: { email: string }) => {
    setError(null);
    try {
      // Unknown emails also return success (no enumeration) — the UI just
      // moves on; only real inboxes receive a code.
      const { error } = await authClient.emailOtp.requestPasswordReset({
        email: email.trim(),
      });
      if (error) throw error;
      hapticSuccess();
      setResetEmail(email.trim());
      setStep("code");
    } catch (e) {
      hapticError();
      setError(message(e));
    }
  };
  const verifyCode = async ({ code }: { code: string }) => {
    setError(null);
    try {
      const { error } = await authClient.emailOtp.checkVerificationOtp({
        email: resetEmail,
        type: "forget-password",
        otp: code.trim(),
      });
      if (error) throw error;
      hapticSuccess();
      setResetCode(code.trim());
      setStep("password");
    } catch (e) {
      hapticError();
      setError(message(e));
    }
  };
  const setPassword = async ({ password }: { password: string }) => {
    setError(null);
    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email: resetEmail,
        otp: resetCode,
        password,
      });
      if (error) throw error;
      hapticSuccess();
      router.replace("/(app)/(tabs)");
    } catch (e) {
      hapticError();
      setError(message(e));
    }
  };
  const activeIndex = steps.findIndex((item) => item.id === step);
  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen options={{ title: "Reset password" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
      >
        <View style={styles.iconBadge}>
          <SymbolView
            name={{ ios: "lock.rotation.open", android: "lock_reset" }}
            tintColor={palette.primary}
            size={28}
          />
        </View>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>
          We’ll send a verification code to your email.
        </Text>
        <View style={styles.stepper}>
          {steps.map((item, index) => {
            const done = index < activeIndex;
            const active = index === activeIndex;
            return (
              <View key={item.id} style={styles.step}>
                <View
                  style={[
                    styles.stepDot,
                    done && styles.stepDotDone,
                    active && styles.stepDotActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      (done || active) && styles.stepNumberLit,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  style={[styles.stepLabel, active && styles.stepLabelActive]}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.card}>
          {step === "email" ? (
            <>
              <Controller
                control={emailForm.control}
                name="email"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Email"
                    placeholder="you@example.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Button
                title="Send reset code"
                onPress={emailForm.handleSubmit(sendCode)}
                loading={emailForm.formState.isSubmitting}
              />
            </>
          ) : step === "code" ? (
            <>
              <Controller
                control={codeForm.control}
                name="code"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Verification code"
                    placeholder="Enter your code"
                    keyboardType="number-pad"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Button
                title="Verify code"
                onPress={codeForm.handleSubmit(verifyCode)}
                loading={codeForm.formState.isSubmitting}
              />
            </>
          ) : (
            <>
              <Controller
                control={passwordForm.control}
                name="password"
                render={({ field, fieldState }) => (
                  <TextField
                    label="New password"
                    placeholder="At least 8 characters"
                    secureTextEntry
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Button
                title="Set new password"
                onPress={passwordForm.handleSubmit(setPassword)}
                loading={passwordForm.formState.isSubmitting}
              />
            </>
          )}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText} selectable>
                {error}
              </Text>
            </View>
          ) : null}
        </View>
        <Link href="/(auth)/sign-in" style={styles.link}>
          Back to sign in
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    content: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 14 },
    iconBadge: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: palette.primarySoft,
      borderWidth: 1,
      borderColor: palette.line,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: palette.ink,
      fontSize: type.title.fontSize,
      fontWeight: "800",
      letterSpacing: type.title.letterSpacing,
    },
    subtitle: {
      color: palette.muted,
      fontSize: type.body.fontSize,
      lineHeight: type.body.lineHeight,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      borderRadius: radius.lg,
      padding: 12,
    },
    step: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
    stepDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: palette.bg,
      borderWidth: 1,
      borderColor: palette.line,
      alignItems: "center",
      justifyContent: "center",
    },
    stepDotDone: {
      backgroundColor: palette.success,
      borderColor: palette.success,
    },
    stepDotActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    stepNumber: { color: palette.faint, fontSize: 12, fontWeight: "800" },
    stepNumberLit: { color: palette.onPrimary },
    stepLabel: {
      color: palette.faint,
      fontSize: 11,
      fontWeight: "700",
      flex: 1,
    },
    stepLabelActive: { color: palette.ink },
    card: {
      backgroundColor: palette.surface,
      borderRadius: radius.lg,
      padding: 18,
      gap: 12,
      borderWidth: 1,
      borderColor: palette.line,
    },
    errorBanner: {
      backgroundColor: palette.dangerSoft,
      borderWidth: 1,
      borderColor: palette.dangerBorder,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    errorText: { color: palette.danger, fontSize: 13, lineHeight: 18 },
    link: { color: palette.primary, fontWeight: "700", textAlign: "center" },
  });
