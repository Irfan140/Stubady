import { useSignIn, useSignUp } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
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

import { Button, TextField, styles as ui } from "@/components/ui";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import { palette, radius, shadow, type } from "@/theme";
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
  const getError = (error: unknown) =>
    error instanceof Error
      ? error.message
      : "Authentication failed. Please try again.";

  const submit = async (values: CredentialsInput) => {
    setServerError(null);
    try {
      if (isSignUp) {
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
        const verification =
          await signUpState.signUp.verifications.sendEmailCode();
        if (verification.error) throw verification.error;
        setVerificationRequired(true);
        return;
      }
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
      throw new Error(
        "This account requires MFA, which is not enabled in this app.",
      );
    } catch (error) {
      setFinishing(false);
      hapticError();
      setServerError(getError(error));
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
      setServerError(getError(error));
    }
  };

  const resendVerification = async () => {
    setServerError(null);
    try {
      const result = await signUpState.signUp.verifications.sendEmailCode();
      if (result.error) throw result.error;
    } catch (error) {
      hapticError();
      setServerError(getError(error));
    }
  };

  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
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
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>AI STUDY COPILOT</Text>
            </View>
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
          {isSignUp ? "Already have an account? " : "New to Studbady? "}
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

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 20 },
  header: { gap: 10 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  logo: { width: 34, height: 34, borderRadius: 10 },
  pill: {
    backgroundColor: palette.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    color: palette.primaryDeep,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
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
  highlights: {
    gap: 8,
    marginTop: 4,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.lg,
    padding: 14,
    ...shadow.card,
  },
  highlightRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  highlightText: { color: palette.body, fontSize: 14, fontWeight: "600" },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.line,
    ...shadow.card,
  },
  cardTitle: {
    color: palette.ink,
    fontSize: type.h2.fontSize,
    fontWeight: "800",
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: palette.line,
    borderRadius: radius.md,
    backgroundColor: "#FAFBFE",
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
    borderColor: "#FECACA",
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
    backgroundColor: "rgba(244, 246, 251, 0.96)",
  },
  transitionTitle: { color: palette.ink, fontSize: 18, fontWeight: "800" },
  transitionText: { color: palette.muted, fontSize: 14 },
});
