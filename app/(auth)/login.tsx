import { FadeInView } from '@/components/animated-components';
import { useAuth } from '@/contexts/auth.context';
import { useTheme } from '@/contexts/theme.context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  // Animations
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [logoOpacity, logoScale]);

  // Create themed styles
  const themedStyles = useMemo(
    () => ({
      container: { ...styles.container, backgroundColor: colors.background },
      title: { ...styles.title, color: colors.text },
      subtitle: { ...styles.subtitle, color: colors.textSecondary },
      label: { ...styles.label, color: colors.text },
      input: {
        ...styles.input,
        backgroundColor: colors.inputBackground,
        borderColor: colors.inputBorder,
        color: colors.text,
      },
      inputFocused: {
        borderColor: colors.primary,
        backgroundColor: colors.background,
      },
      inputError: {
        borderColor: colors.error,
        backgroundColor: colors.errorLight,
      },
      errorText: { ...styles.errorText, color: colors.error },
      generalErrorContainer: {
        ...styles.generalErrorContainer,
        backgroundColor: colors.errorLight,
        borderLeftColor: colors.error,
      },
      generalErrorText: { ...styles.generalErrorText, color: colors.error },
      footerText: { ...styles.footerText, color: colors.textSecondary },
      linkText: { ...styles.linkText, color: colors.primary },
    }),
    [colors]
  );

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signIn(email.trim(), password);
    } catch (error: any) {
      let errorMessage = 'Failed to sign in. Please try again.';

      if (error.message) {
        if (
          error.message.includes('user-not-found') ||
          error.message.includes('wrong-password')
        ) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('invalid-email')) {
          errorMessage = 'Please enter a valid email address';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('too-many-requests')) {
          errorMessage = 'Too many attempts. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }

      setErrors({ general: errorMessage });
      Alert.alert('Login Failed', errorMessage);
      setLoading(false);
    }
  };

  const navigateToSignup = () => {
    router.push('/(auth)/signup' as any);
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <KeyboardAvoidingView
      style={themedStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo/Brand Section */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>CC</Text>
            </LinearGradient>
          </Animated.View>

          <FadeInView delay={200} direction="up">
            <View style={styles.header}>
              <Text style={themedStyles.title}>Welcome Back</Text>
              <Text style={themedStyles.subtitle}>
                Sign in to continue to CampusConnect
              </Text>
            </View>
          </FadeInView>

          <FadeInView delay={300} direction="up">
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={themedStyles.label}>Email</Text>
                <TextInput
                  style={[
                    themedStyles.input,
                    focusedInput === 'email' && themedStyles.inputFocused,
                    errors.email && themedStyles.inputError,
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.placeholder}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined });
                    }
                  }}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!loading}
                />
                {errors.email && (
                  <Text style={themedStyles.errorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={themedStyles.label}>Password</Text>
                <TextInput
                  style={[
                    themedStyles.input,
                    focusedInput === 'password' && themedStyles.inputFocused,
                    errors.password && themedStyles.inputError,
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined });
                    }
                  }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!loading}
                />
                {errors.password && (
                  <Text style={themedStyles.errorText}>{errors.password}</Text>
                )}
              </View>

              {errors.general && (
                <FadeInView direction="none">
                  <View style={themedStyles.generalErrorContainer}>
                    <Text style={themedStyles.generalErrorText}>
                      {errors.general}
                    </Text>
                  </View>
                </FadeInView>
              )}

              <Pressable
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                onPress={handleLogin}
                disabled={loading}
              >
                <Animated.View
                  style={[
                    { transform: [{ scale: buttonScale }] },
                    loading && styles.buttonDisabled,
                  ]}
                >
                  <LinearGradient
                    colors={
                      loading
                        ? [colors.textDisabled, colors.textDisabled]
                        : [colors.primary, '#8b5cf6']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, theme.shadows.md]}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.onPrimary} />
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </Animated.View>
              </Pressable>

              <View style={styles.footer}>
                <Text style={themedStyles.footerText}>
                  Don&apos;t have an account?{' '}
                </Text>
                <Pressable onPress={navigateToSignup} disabled={loading}>
                  <Text style={themedStyles.linkText}>Sign Up</Text>
                </Pressable>
              </View>
            </View>
          </FadeInView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#1a1a1a',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
    marginLeft: 4,
  },
  generalErrorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  generalErrorText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 15,
    color: '#666',
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
  },
});
