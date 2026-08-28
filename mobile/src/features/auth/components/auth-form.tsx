import { useSignIn, useSignUp } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button, styles as ui } from "@/components/ui";
import {
  credentialsSchema,
  verificationSchema,
  type CredentialsInput,
} from "../schemas";
import { GoogleSignInButton } from "./google-sign-in-button";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const signInState = useSignIn();
  const signUpState = useSignUp();
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
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
        router.replace("/(app)/(tabs)");
        return;
      }
      throw new Error(
        "This account requires MFA, which is not enabled in this app.",
      );
    } catch (error) {
      setFinishing(false);
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
      router.replace("/(app)/(tabs)");
    } catch (error) {
      setFinishing(false);
      setServerError(getError(error));
    }
  };

  const resendVerification = async () => {
    setServerError(null);
    try {
      const result = await signUpState.signUp.verifications.sendEmailCode();
      if (result.error) throw result.error;
    } catch (error) {
      setServerError(getError(error));
    }
  };

  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>STUDBADY</Text>
          <Text style={styles.title}>
            {isSignUp ? "Start learning smarter." : "Welcome back."}
          </Text>
          <Text style={ui.muted}>
            {isSignUp
              ? "Create your account and turn your notes into a study plan."
              : "Pick up where you left off."}
          </Text>
        </View>
        {verificationRequired ? (
          <View style={ui.card}>
            <Text style={styles.subtitle}>Check your email</Text>
            <Text style={ui.muted}>
              Enter the verification code we sent to your email address.
            </Text>
            <Controller
              control={verificationForm.control}
              name="code"
              render={({ field, fieldState }) => (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Verification code"
                    keyboardType="number-pad"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                  />
                  <Text style={styles.fieldError}>
                    {fieldState.error?.message}
                  </Text>
                </>
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
              <Text style={styles.fieldError} selectable>
                {serverError}
              </Text>
            ) : null}
          </View>
        ) : (
          <>
            <GoogleSignInButton showDivider />
            <View style={ui.card}>
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field
                    label="Email"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field
                    label="Password"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                    secureTextEntry
                  />
                )}
              />
              {serverError ? (
                <Text style={styles.fieldError} selectable>
                  {serverError}
                </Text>
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
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.transitionTitle}>
            Opening your study space...
          </Text>
          <Text style={styles.transitionText}>Your account is ready.</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  error,
  ...props
}: { label: string; error?: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={styles.input}
        placeholder={label}
        placeholderTextColor="#94A3B8"
      />
      <Text style={styles.fieldError}>{error}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 20 },
  header: { gap: 8 },
  eyebrow: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    color: "#0F172A",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
  },
  subtitle: { color: "#0F172A", fontSize: 21, fontWeight: "700" },
  field: { gap: 5 },
  label: { color: "#334155", fontSize: 14, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    color: "#0F172A",
    fontSize: 16,
    backgroundColor: "#F8FAFC",
  },
  fieldError: { minHeight: 17, color: "#B91C1C", fontSize: 12 },
  switch: { color: "#64748B", textAlign: "center", fontSize: 14 },
  link: { color: "#2563EB", fontWeight: "700" },
  forgot: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  transition: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(248, 250, 252, 0.96)",
  },
  transitionTitle: { color: "#0F172A", fontSize: 18, fontWeight: "800" },
  transitionText: { color: "#64748B", fontSize: 14 },
});
