import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
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
import {
  authClient,
  clearPendingVerificationEmail,
  getPendingVerificationEmail,
  savePendingVerificationEmail,
} from "@/lib/auth-client";
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
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  // A pending verification outlives this screen (app restart, email-app
  // round trip). Restore it so the user lands back on the code step.
  useEffect(() => {
    let cancelled = false;
    void getPendingVerificationEmail().then((email) => {
      if (!cancelled && email) {
        setVerificationEmail(email);
        setVerificationRequired(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const form = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });
  const verificationForm = useForm<{ code: string }>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { code: "" },
  });
  const authMessage = (error: unknown): string => {
    const anyErr = error as {
      message?: string;
      code?: string;
    };
    const code = (anyErr?.code ?? "") as string;
    const raw = (anyErr?.message ?? "") as string;
    const lower = `${code} ${raw}`.toLowerCase();
    if (
      lower.includes("credential") ||
      lower.includes("password is not set") ||
      lower.includes("no password")
    ) {
      return "This account was created with Google. Please use “Continue with Google” or tap “Forgot password?” to set a password for this email.";
    }
    if (
      code === "INVALID_EMAIL_OR_PASSWORD" ||
      lower.includes("invalid email or password")
    ) {
      return isSignUp
        ? "Could not create this account. Try signing in instead."
        : "Incorrect email or password. Try again or tap “Forgot password?” to reset it.";
    }
    if (
      code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
      lower.includes("already exists")
    ) {
      return "An account with this email already exists. Please sign in instead.";
    }
    if (
      code === "INVALID_OTP" ||
      code === "EXPIRED_OTP" ||
      lower.includes("otp")
    ) {
      return "That code didn’t work. Check it and try again, or resend a fresh code.";
    }
    if (code === "TOO_MANY_ATTEMPTS" || lower.includes("too many attempts")) {
      return "Too many tries. Request a new code and try again.";
    }
    if (code === "EMAIL_NOT_VERIFIED" || lower.includes("not verified")) {
      return "Please verify your email first — we’ve sent a fresh code.";
    }
    if (raw) return raw;
    if (error instanceof Error) return error.message;
    return "Authentication failed. Please try again.";
  };

  const submit = async (values: CredentialsInput) => {
    setServerError(null);
    try {
      const email = values.email.trim();
      if (isSignUp) {
        // The form has no name field; derive one so the UI stays unchanged.
        const name = email.split("@")[0] || email;
        const { error } = await authClient.signUp.email({
          name,
          email,
          password: values.password,
        });
        if (error) throw error;
        // Sign-up creates no session until verified; the server sends the
        // email OTP. Verification signs in automatically.
        savePendingVerificationEmail(email);
        setVerificationEmail(email);
        setVerificationRequired(true);
        return;
      }
      const { error } = await authClient.signIn.email({
        email,
        password: values.password,
      });
      if (error) {
        // Signed up earlier but never verified (e.g. app was closed):
        // send a fresh code and move to the verify screen instead of
        // erroring out. Verification signs in via autoSignInAfterVerification.
        if ((error as { code?: string }).code === "EMAIL_NOT_VERIFIED") {
          const resent = await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "email-verification",
          });
          if (resent.error) throw resent.error;
          savePendingVerificationEmail(email);
          setVerificationEmail(email);
          setVerificationRequired(true);
          return;
        }
        throw error;
      }
      setFinishing(true);
      hapticSuccess();
      router.replace("/(app)/(tabs)");
    } catch (error) {
      setFinishing(false);
      hapticError();
      setServerError(authMessage(error));
    }
  };

  const verify = async ({ code }: { code: string }) => {
    setServerError(null);
    try {
      const { error } = await authClient.emailOtp.verifyEmail({
        email: verificationEmail,
        otp: code.trim(),
      });
      if (error) throw error;
      clearPendingVerificationEmail();
      setFinishing(true);
      hapticSuccess();
      router.replace("/(app)/(tabs)");
    } catch (error) {
      setFinishing(false);
      hapticError();
      setServerError(authMessage(error));
    }
  };

  const resendVerification = async () => {
    setServerError(null);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: verificationEmail,
        type: "email-verification",
      });
      if (error) throw error;
      hapticSuccess();
    } catch (error) {
      hapticError();
      setServerError(authMessage(error));
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
              Enter the verification code we sent
              {verificationEmail ? ` to ${verificationEmail}` : ""}.
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
            <Button
              title="Use a different email"
              variant="secondary"
              onPress={() => {
                clearPendingVerificationEmail();
                setVerificationEmail("");
                verificationForm.reset({ code: "" });
                setServerError(null);
                setVerificationRequired(false);
              }}
            />
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
                loading={form.formState.isSubmitting}
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
