import { useSignIn } from "@clerk/expo";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Stack, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { z } from "zod";

import { Button, Card, styles as ui } from "@/components/ui";

const emailSchema = z.object({ email: z.email("Enter a valid email address") });
const codeSchema = z.object({
  code: z.string().trim().min(4, "Enter the verification code"),
});
const passwordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters"),
});
type Step = "email" | "code" | "password";

export default function ForgotPassword() {
  const { signIn } = useSignIn();
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
      setStep("code");
    } catch (e) {
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
      setStep("password");
    } catch (e) {
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
        router.replace("/(app)/(tabs)");
      }
    } catch (e) {
      setError(message(e));
    }
  };
  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ title: "Reset password" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Reset your password</Text>
        <Text style={ui.muted}>
          We’ll send a verification code to your email.
        </Text>
        <Card>
          {step === "email" ? (
            <>
              <Controller
                control={emailForm.control}
                name="email"
                render={({ field, fieldState }) => (
                  <>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={styles.input}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="you@example.com"
                    />
                    <Text style={styles.error}>
                      {fieldState.error?.message}
                    </Text>
                  </>
                )}
              />
              <Button
                title="Send reset code"
                onPress={emailForm.handleSubmit(sendCode)}
                disabled={emailForm.formState.isSubmitting}
              />
            </>
          ) : step === "code" ? (
            <>
              <Text style={styles.label}>Verification code</Text>
              <Controller
                control={codeForm.control}
                name="code"
                render={({ field, fieldState }) => (
                  <>
                    <TextInput
                      keyboardType="number-pad"
                      style={styles.input}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Enter your code"
                    />
                    <Text style={styles.error}>
                      {fieldState.error?.message}
                    </Text>
                  </>
                )}
              />
              <Button
                title="Verify code"
                onPress={codeForm.handleSubmit(verifyCode)}
                disabled={codeForm.formState.isSubmitting}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>New password</Text>
              <Controller
                control={passwordForm.control}
                name="password"
                render={({ field, fieldState }) => (
                  <>
                    <TextInput
                      secureTextEntry
                      style={styles.input}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="At least 8 characters"
                    />
                    <Text style={styles.error}>
                      {fieldState.error?.message}
                    </Text>
                  </>
                )}
              />
              <Button
                title="Set new password"
                onPress={passwordForm.handleSubmit(setPassword)}
                disabled={passwordForm.formState.isSubmitting}
              />
            </>
          )}
          {error ? (
            <Text style={styles.error} selectable>
              {error}
            </Text>
          ) : null}
        </Card>
        <Link href="/(auth)/sign-in" style={styles.link}>
          Back to sign in
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 16 },
  title: { color: "#0F172A", fontSize: 30, fontWeight: "800" },
  label: { color: "#334155", fontSize: 14, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  error: { color: "#B91C1C", fontSize: 13, minHeight: 17 },
  link: { color: "#2563EB", fontWeight: "700", textAlign: "center" },
});
