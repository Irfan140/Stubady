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

import { Button, TextField, styles as ui } from "@/components/ui";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import { palette, radius, shadow, type } from "@/theme";

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
  const message = (value: unknown) =>
    value instanceof Error
      ? value.message
      : "Password reset failed. Please try again.";

  const sendCode = async ({ email }: { email: string }) => {
    setError(null);
    try {
      const created = await signIn.create({ identifier: email });
      if (created.error) {
        setError(message(created.error));
        return;
      }
      const sent = await signIn.resetPasswordEmailCode.sendCode();
      if (sent.error) {
        setError(message(sent.error));
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
        return;
      }
      if (signIn.status === "complete") {
        const finalized = await signIn.finalize();
        if (finalized.error) {
          setError(message(finalized.error));
          return;
        }
        hapticSuccess();
        router.replace("/(app)/(tabs)");
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
      <StatusBar style="dark" />
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

const styles = StyleSheet.create({
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
    ...shadow.card,
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
  stepNumberLit: { color: "#FFFFFF" },
  stepLabel: { color: palette.faint, fontSize: 11, fontWeight: "700", flex: 1 },
  stepLabelActive: { color: palette.ink },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.line,
    ...shadow.card,
  },
  errorBanner: {
    backgroundColor: palette.dangerSoft,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { color: palette.danger, fontSize: 13, lineHeight: 18 },
  link: { color: palette.primary, fontWeight: "700", textAlign: "center" },
});
