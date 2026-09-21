import { useSignIn, useSignUp } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, TextField, useUiStyles } from "@/components/ui";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import { useTheme } from "@/stores/theme-store";
import { radius, type } from "@/theme";
import type { Palette } from "@/theme";
import {
  credentialsSchema,
  verificationSchema,
  type CredentialsInput,
} from "../schemas";
import { GoogleSignInButton } from "./google-sign-in-button";

const highlights = [
  { label: "Summaries from your own material" },
  { label: "Flashcards generated in seconds" },
  { label: "A tutor chat for every study set" },
];

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { palette, isDark } = useTheme();
  const ui = useUiStyles();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isSignUp = mode === "sign-up";
  const signInState = useSignIn();
  const signUpState = useSignUp();
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const form = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });
  const verificationForm = useForm<{ code: string }>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { code: "" },
  });
  const clerkMessage = (error: unknown): string => {
    const anyErr = error as {
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
    if (
      lower.includes("verification_strategy_not_valid") ||
      lower.includes("verification strategy is not valid") ||
      lower.includes("strategy is not valid")
    ) {
      return "This account was created with Google. Please use “Continue with Google” or tap “Forgot password?” to set a password for this email.";
    }
    if (code === "form_identifier_not_found" || lower.includes("identifier not found")) {
      return "No account found with this email. Check the address or create a new account.";
    }
    if (code === "form_password_incorrect" || lower.includes("password is incorrect")) {
      return "Incorrect password. Try again or tap “Forgot password?” to reset it.";
    }
    if (code === "form_password_pwned" || lower.includes("pwned")) {
      return "This password was found in a data breach. Please choose a stronger password.";
    }
    if (code === "form_identifier_exists" || lower.includes("identifier exists") || lower.includes("already exists")) {
      return "An account with this email already exists. Please sign in instead.";
    }
    if (raw) return raw;
    if (error instanceof Error) return error.message;
    return "Authentication failed. Please try again.";
  };

  const ensureFreshSignIn = async (email: string) => {
    const s = signInState.signIn;
    // Clerk's SignIn is a singleton. If a previous attempt (e.g. failed OAuth, stale identifier, MFA)
    // is still cached, reusing it with a different email/strategy yields
    // `verification_strategy_not_valid`. Reset when the identifier drifts or the
    // status shows a non-password first factor is cached.
    try {
      if (s.identifier && s.identifier.toLowerCase() !== email.toLowerCase()) {
        await s.reset();
        return;
      }
      if (
        s.status &&
        s.status !== "complete" &&
        s.supportedFirstFactors?.length &&
        s.supportedFirstFactors.every((f) => f.strategy !== "password")
      ) {
        await s.reset();
      }
    } catch {
      // reset is local-only; ignore
    }
  };

  const ensureFreshSignUp = async (email: string) => {
    const s = signUpState.signUp;
    try {
      if (
        s.emailAddress &&
        s.emailAddress.toLowerCase() !== email.toLowerCase()
      ) {
        await s.reset();
      }
    } catch {
      // ignore
    }
  };

  const submit = async (values: CredentialsInput) => {
    setServerError(null);
    // guards: Clerk signals have no isLoaded flag in Future API, but fetchStatus tells us
    // an in-flight request is happening. Buttons are disabled via fetchStatus/fetching elsewhere.
    try {
      if (isSignUp) {
        await ensureFreshSignUp(values.email);
        const result = await signUpState.signUp.password({
          emailAddress: values.email,
          password: values.password,
        });
        if (result.error) throw result.error;
        if (signUpState.signUp.status === "complete") {
          setFinishing(true);
          const finalized = await signUpState.signUp.finalize();
          if (finalized.error) throw finalized.error;
          hapticSuccess();
          router.replace("/(app)/(tabs)");
          return;
        }
        // needs verification (email_address unverified)
        if (
          signUpState.signUp.status === "missing_requirements" &&
          signUpState.signUp.unverifiedFields.includes("email_address")
        ) {
          const verification =
            await signUpState.signUp.verifications.sendEmailCode();
          if (verification.error) throw verification.error;
          setVerificationRequired(true);
          return;
        }
        // Account already exists but password sign-up was transferable -> Clerk may want sign-in
        if (signUpState.signUp.status === "missing_requirements") {
          const verification =
            await signUpState.signUp.verifications.sendEmailCode();
          if (!verification.error) {
            setVerificationRequired(true);
            return;
          }
          throw verification.error;
        }
        setVerificationRequired(true);
        return;
      }
      await ensureFreshSignIn(values.email);
      const result = await signInState.signIn.password({
        emailAddress: values.email,
        password: values.password,
      });
      if (result.error) throw result.error;
      if (signInState.signIn.status === "complete") {
        setFinishing(true);
        const finalized = await signInState.signIn.finalize();
        if (finalized.error) throw finalized.error;
        hapticSuccess();
        router.replace("/(app)/(tabs)");
        return;
      }
      if (signInState.signIn.status === "needs_second_factor") {
        throw new Error(
          "This account has two-step verification enabled. Please verify the second factor.",
        );
      }
      if (signInState.signIn.status === "needs_new_password") {
        throw new Error(
          "You need to set a new password. Use “Forgot password?” to complete setup, then sign in again.",
        );
      }
      throw new Error(
        "Additional verification is required for this account. Please use “Forgot password?” or “Continue with Google”.",
      );
    } catch (error) {
      setFinishing(false);
      hapticError();
      setServerError(clerkMessage(error));
    }
  };

  const verify = async ({ code }: { code: string }) => {
    setServerError(null);
    try {
      const result = await signUpState.signUp.verifications.verifyEmailCode({
        code,
      });
      if (result.error) throw result.error;
      setFinishing(true);
      const finalized = await signUpState.signUp.finalize();
      if (finalized.error) throw finalized.error;
      hapticSuccess();
      router.replace("/(app)/(tabs)");
    } catch (error) {
      setFinishing(false);
      hapticError();
      setServerError(clerkMessage(error));
    }
  };

  const resendVerification = async () => {
    setServerError(null);
    try {
      const result = await signUpState.signUp.verifications.sendEmailCode();
      if (result.error) throw result.error;
      hapticSuccess();
    } catch (error) {
      hapticError();
      setServerError(clerkMessage(error));
    }
  };

  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <Text style={styles.title}>
            {isSignUp ? "Start learning smarter." : "Welcome back."}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? "Create your account and turn your notes into summaries, flashcards, and focused chats."
              : "Pick up where you left off."}
          </Text>
          {isSignUp ? (
            <View style={styles.highlights}>
              {highlights.map((item) => (
                <View key={item.label} style={styles.highlightRow}>
                  <SymbolView
                    name={{
                      ios: "checkmark.circle.fill",
                      android: "check_circle",
                    }}
                    tintColor={palette.primary}
                    size={18}
                  />
                  <Text style={styles.highlightText}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        {verificationRequired ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Check your email</Text>
            <Text style={ui.muted}>
              Enter the verification code we sent to your email address.
            </Text>
            <Controller
              control={verificationForm.control}
              name="code"
              render={({ field, fieldState }) => (
                <TextField
                  label="Verification code"
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Button
              title="Verify email"
              loading={verificationForm.formState.isSubmitting}
              onPress={verificationForm.handleSubmit(verify)}
            />
            <Button
              title="Resend code"
              variant="secondary"
              onPress={() => {
                void resendVerification();
              }}
            />
            {serverError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText} selectable>
                  {serverError}
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <>
            <GoogleSignInButton showDivider />
            <View style={styles.card}>
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Email"
                    placeholder="you@example.com"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              />
              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <View style={ui.field}>
                    <Text style={ui.label}>Password</Text>
                    <View style={styles.passwordWrap}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Your password"
                        placeholderTextColor={palette.faint}
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        secureTextEntry={!passwordVisible}
                        autoCapitalize="none"
                        autoComplete={
                          isSignUp ? "new-password" : "current-password"
                        }
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          passwordVisible ? "Hide password" : "Show password"
                        }
                        hitSlop={12}
                        onPress={() => setPasswordVisible((value) => !value)}
                        style={styles.eyeButton}
                      >
                        <SymbolView
                          name={{
                            ios: passwordVisible ? "eye.slash" : "eye",
                            android: passwordVisible
                              ? "visibility_off"
                              : "visibility",
                          }}
                          tintColor={palette.muted}
                          size={20}
                        />
                      </Pressable>
                    </View>
                    <Text style={ui.fieldError}>
                      {fieldState.error?.message}
                    </Text>
                  </View>
                )}
              />
              {serverError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText} selectable>
                    {serverError}
                  </Text>
                </View>
              ) : null}
              <Button
                title={isSignUp ? "Create account" : "Sign in"}
                loading={
                  form.formState.isSubmitting ||
                  signInState.fetchStatus === "fetching" ||
                  signUpState.fetchStatus === "fetching"
                }
                onPress={form.handleSubmit(submit)}
              />
              {!isSignUp ? (
                <Link href="/(auth)/forgot-password" style={styles.forgot}>
                  Forgot password?
                </Link>
              ) : null}
            </View>
          </>
        )}
        <Text style={styles.switch}>
          {isSignUp ? "Already have an account? " : "New to Stubady? "}
          <Link
            href={isSignUp ? "/(auth)/sign-in" : "/(auth)/sign-up"}
            style={styles.link}
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </Text>
        {isSignUp ? <View nativeID="clerk-captcha" /> : null}
      </ScrollView>
      {finishing ? (
        <View style={styles.transition}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.transitionTitle}>
            Opening your study space...
          </Text>
          <Text style={styles.transitionText}>Your account is ready.</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    content: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 20 },
    header: { gap: 12 },
    logoBadge: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      alignItems: "center",
      justifyContent: "center",
    },
    logo: { width: 36, height: 36, borderRadius: 10 },
    title: {
      color: palette.ink,
      fontSize: type.display.fontSize,
      fontWeight: "800",
      letterSpacing: type.display.letterSpacing,
    },
    subtitle: {
      color: palette.muted,
      fontSize: type.body.fontSize,
      lineHeight: type.body.lineHeight,
    },
    highlights: { gap: 10, marginTop: 4 },
    highlightRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    highlightText: { color: palette.body, fontSize: 14, fontWeight: "600" },
    card: {
      backgroundColor: palette.surface,
      borderRadius: radius.lg,
      padding: 18,
      gap: 12,
      borderWidth: 1,
      borderColor: palette.line,
    },
    cardTitle: {
      color: palette.ink,
      fontSize: type.h2.fontSize,
      fontWeight: "800",
    },
    passwordWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: palette.line,
      borderRadius: radius.md,
      backgroundColor: palette.inputBg,
      paddingRight: 6,
    },
    passwordInput: {
      flex: 1,
      minHeight: 50,
      paddingHorizontal: 14,
      color: palette.ink,
      fontSize: 16,
    },
    eyeButton: { padding: 8 },
    errorBanner: {
      backgroundColor: palette.dangerSoft,
      borderWidth: 1,
      borderColor: palette.dangerBorder,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    errorText: { color: palette.danger, fontSize: 13, lineHeight: 18 },
    switch: { color: palette.muted, textAlign: "center", fontSize: 14 },
    link: { color: palette.primary, fontWeight: "700" },
    forgot: {
      color: palette.primary,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    transition: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: `${palette.bg}F5`,
    },
    transitionTitle: { color: palette.ink, fontSize: 18, fontWeight: "800" },
    transitionText: { color: palette.muted, fontSize: 14 },
  });
