import { useSignIn } from "@clerk/expo";
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
  const { signIn } = useSignIn();
  const insets = useSafeAreaInsets();
  const [step, setStep] = React.useState<Step>("email");
  const [error, setError] = React.useState<string | null>(null);
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
    const anyErr = value as {
      message?: string;
      errors?: { code?: string; message?: string; longMessage?: string }[];
      code?: string;
    };
    const first = anyErr?.errors?.[0];
    const code = (first?.code ?? anyErr?.code ?? "") as string;
    const raw = (first?.longMessage ??
      first?.message ??
      anyErr?.message ??
      "") as string;
    const lower = `${code} ${raw}`.toLowerCase();
    if (lower.includes("verification_strategy_not_valid") || lower.includes("verification strategy")) {
      return "This email can’t receive a password reset code that way. If it was created with Google, use “Continue with Google” or contact support.";
    }
    if (code === "form_identifier_not_found" || lower.includes("identifier not found")) {
      return "No account found with this email.";
    }
    if (raw) return raw;
    if (value instanceof Error) return value.message;
    return "Password reset failed. Please try again.";
  };

  const ensureFresh = async (email: string) => {
    try {
      if (signIn.identifier && signIn.identifier.toLowerCase() !== email.toLowerCase()) {
        await signIn.reset();
      } else if (
        signIn.status &&
        signIn.status !== "complete" &&
        signIn.status !== "needs_identifier"
      ) {
        // stale attempt from previous sign-in/auth-form attempt – clear it
        const needsReset =
          signIn.supportedFirstFactors?.length === 0 ||
          signIn.supportedFirstFactors?.every((f) => f.strategy !== "email_code");
        if (needsReset && signIn.status !== "needs_new_password") {
          // only reset if not already in reset-password flow
          await signIn.reset();
        }
      }
    } catch {
      // reset is local-only; ignore
    }
  };

  const sendCode = async ({ email }: { email: string }) => {
    setError(null);
    try {
      await ensureFresh(email);
      // Future API: create with identifier then sendCode to that identifier's first email.
      // Keep create step for parity with current instance, but gracefully handle if
      // signIn already holds this identifier.
      if (!signIn.identifier || signIn.identifier.toLowerCase() !== email.toLowerCase()) {
        const created = await signIn.create({ identifier: email });
        if (created.error) {
          setError(message(created.error));
          hapticError();
          return;
        }
      }
      const sent = await signIn.resetPasswordEmailCode.sendCode();
      if (sent.error) {
        setError(message(sent.error));
        hapticError();
        return;
      }
      hapticSuccess();
      setStep("code");
    } catch (e) {
      hapticError();
      setError(message(e));
    }
  };
  const verifyCode = async ({ code }: { code: string }) => {
    setError(null);
    try {
      const result = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (result.error) {
        setError(message(result.error));
        hapticError();
        return;
      }
      hapticSuccess();
      setStep("password");
    } catch (e) {
      hapticError();
      setError(message(e));
    }
  };
  const setPassword = async ({ password }: { password: string }) => {
    setError(null);
    try {
      const result = await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      });
      if (result.error) {
        setError(message(result.error));
        hapticError();
        return;
      }
      if (signIn.status === "complete") {
        const finalized = await signIn.finalize();
        if (finalized.error) {
          setError(message(finalized.error));
          hapticError();
          return;
        }
        hapticSuccess();
        router.replace("/(app)/(tabs)");
      } else if (signIn.status === "needs_new_password") {
        // still needs new password – stay on step, surface help
        setError("Please choose a different password that meets the requirements.");
        hapticError();
      }
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
