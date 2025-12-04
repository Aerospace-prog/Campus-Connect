import { FadeInView } from '@/components/animated-components';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth.context';
import { useTheme } from '@/contexts/theme.context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors, theme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'admin' | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    role?: string;
    general?: string;
  }>({});

  // Animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const studentRoleScale = useRef(new Animated.Value(1)).current;
  const adminRoleScale = useRef(new Animated.Value(1)).current;

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
      roleOption: {
        ...styles.roleOption,
        backgroundColor: colors.inputBackground,
        borderColor: colors.inputBorder,
      },
      roleOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
      },
      roleOptionError: {
        borderColor: colors.error,
      },
      roleTitle: { ...styles.roleTitle, color: colors.text },
      roleTextSelected: { color: colors.primary },
      roleDescription: { ...styles.roleDescription, color: colors.textSecondary },
      roleDescriptionSelected: { color: colors.primary },
    }),
    [colors]
  );

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      role?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!selectedRole) {
      newErrors.role = 'Please select your role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signUp(email.trim(), password, name.trim(), selectedRole!);
    } catch (error: any) {
      let errorMessage = 'Failed to create account. Please try again.';

      if (error.message) {
        if (error.message.includes('email-already-in-use')) {
          errorMessage =
            'This email is already registered. Please sign in instead.';
        } else if (error.message.includes('invalid-email')) {
          errorMessage = 'Please enter a valid email address';
        } else if (error.message.includes('weak-password')) {
          errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message;
        }
      }

      setErrors({ general: errorMessage });
      Alert.alert('Signup Failed', errorMessage);
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/(auth)/login' as any);
  };

  const handleRoleSelect = useCallback(
    (role: 'student' | 'admin') => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedRole(role);
      if (errors.role) {
        setErrors({ ...errors, role: undefined });
      }

      // Animate the selected role
      const scaleAnim = role === 'student' ? studentRoleScale : adminRoleScale;
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    },
    [adminRoleScale, errors, studentRoleScale]
  );

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
          <FadeInView delay={0} direction="up">
            <View style={styles.header}>
              <Text style={themedStyles.title}>Create Account</Text>
              <Text style={themedStyles.subtitle}>
                Join CampusConnect today
              </Text>
            </View>
          </FadeInView>

          <View style={styles.form}>
            <FadeInView delay={100} direction="up">
              <View style={styles.inputContainer}>
                <Text style={themedStyles.label}>Full Name</Text>
                <TextInput
                  style={[
                    themedStyles.input,
                    focusedInput === 'name' && themedStyles.inputFocused,
                    errors.name && themedStyles.inputError,
                  ]}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.placeholder}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) {
                      setErrors({ ...errors, name: undefined });
                    }
                  }}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="words"
                  autoComplete="name"
                  editable={!loading}
                />
                {errors.name && (
                  <Text style={themedStyles.errorText}>{errors.name}</Text>
                )}
              </View>
            </FadeInView>

            <FadeInView delay={150} direction="up">
              <View style={styles.inputContainer}>
                <Text style={themedStyles.label}>I am a...</Text>
                <View style={styles.roleContainer}>
                  <Pressable
                    onPress={() => handleRoleSelect('student')}
                    disabled={loading}
                  >
                    <Animated.View
                      style={[
                        themedStyles.roleOption,
                        selectedRole === 'student' &&
                          themedStyles.roleOptionSelected,
                        errors.role &&
                          !selectedRole &&
                          themedStyles.roleOptionError,
                        { transform: [{ scale: studentRoleScale }] },
                      ]}
                    >
                      <View style={styles.roleIconContainer}>
                        <View
                          style={[
                            styles.roleIcon,
                            {
                              backgroundColor:
                                selectedRole === 'student'
                                  ? colors.primary
                                  : colors.backgroundTertiary,
                            },
                          ]}
                        >
                          <IconSymbol
                            name="person.fill"
                            size={20}
                            color={
                              selectedRole === 'student'
                                ? '#fff'
                                : colors.textSecondary
                            }
                          />
                        </View>
                      </View>
                      <View style={styles.roleContent}>
                        <Text
                          style={[
                            themedStyles.roleTitle,
                            selectedRole === 'student' &&
                              themedStyles.roleTextSelected,
                          ]}
                        >
                          Student
                        </Text>
                        <Text
                          style={[
                            themedStyles.roleDescription,
                            selectedRole === 'student' &&
                              themedStyles.roleDescriptionSelected,
                          ]}
                        >
                          Browse and RSVP to events
                        </Text>
                      </View>
                      {selectedRole === 'student' && (
                        <View
                          style={[
                            styles.checkmark,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <IconSymbol name="checkmark" size={14} color="#fff" />
                        </View>
                      )}
                    </Animated.View>
                  </Pressable>

                  <Pressable
                    onPress={() => handleRoleSelect('admin')}
                    disabled={loading}
                  >
                    <Animated.View
                      style={[
                        themedStyles.roleOption,
                        selectedRole === 'admin' &&
                          themedStyles.roleOptionSelected,
                        errors.role &&
                          !selectedRole &&
                          themedStyles.roleOptionError,
                        { transform: [{ scale: adminRoleScale }] },
                      ]}
                    >
                      <View style={styles.roleIconContainer}>
                        <View
                          style={[
                            styles.roleIcon,
                            {
                              backgroundColor:
                                selectedRole === 'admin'
                                  ? colors.secondary
                                  : colors.backgroundTertiary,
                            },
                          ]}
                        >
                          <IconSymbol
                            name="star.fill"
                            size={20}
                            color={
                              selectedRole === 'admin'
                                ? '#fff'
                                : colors.textSecondary
                            }
                          />
                        </View>
                      </View>
                      <View style={styles.roleContent}>
                        <Text
                          style={[
                            themedStyles.roleTitle,
                            selectedRole === 'admin' &&
                              themedStyles.roleTextSelected,
                          ]}
                        >
                          Event Organizer
                        </Text>
                        <Text
                          style={[
                            themedStyles.roleDescription,
                            selectedRole === 'admin' &&
                              themedStyles.roleDescriptionSelected,
                          ]}
                        >
                          Create and manage events
                        </Text>
                      </View>
                      {selectedRole === 'admin' && (
                        <View
                          style={[
                            styles.checkmark,
                            { backgroundColor: colors.secondary },
                          ]}
                        >
                          <IconSymbol name="checkmark" size={14} color="#fff" />
                        </View>
                      )}
                    </Animated.View>
                  </Pressable>
                </View>
                {errors.role && (
                  <Text style={themedStyles.errorText}>{errors.role}</Text>
                )}
              </View>
            </FadeInView>

            <FadeInView delay={200} direction="up">
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
            </FadeInView>

            <FadeInView delay={250} direction="up">
              <View style={styles.inputContainer}>
                <Text style={themedStyles.label}>Password</Text>
                <TextInput
                  style={[
                    themedStyles.input,
                    focusedInput === 'password' && themedStyles.inputFocused,
                    errors.password && themedStyles.inputError,
                  ]}
                  placeholder="Create a password (min. 6 characters)"
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
                  autoComplete="password-new"
                  editable={!loading}
                />
                {errors.password && (
                  <Text style={themedStyles.errorText}>{errors.password}</Text>
                )}
              </View>
            </FadeInView>

            <FadeInView delay={300} direction="up">
              <View style={styles.inputContainer}>
                <Text style={themedStyles.label}>Confirm Password</Text>
                <TextInput
                  style={[
                    themedStyles.input,
                    focusedInput === 'confirmPassword' &&
                      themedStyles.inputFocused,
                    errors.confirmPassword && themedStyles.inputError,
                  ]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.placeholder}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: undefined });
                    }
                  }}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  editable={!loading}
                />
                {errors.confirmPassword && (
                  <Text style={themedStyles.errorText}>
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>
            </FadeInView>

            {errors.general && (
              <FadeInView direction="none">
                <View style={themedStyles.generalErrorContainer}>
                  <Text style={themedStyles.generalErrorText}>
                    {errors.general}
                  </Text>
                </View>
              </FadeInView>
            )}

            <FadeInView delay={350} direction="up">
              <Pressable
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                onPress={handleSignup}
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
                      <Text style={styles.buttonText}>Create Account</Text>
                    )}
                  </LinearGradient>
                </Animated.View>
              </Pressable>

              <View style={styles.footer}>
                <Text style={themedStyles.footerText}>
                  Already have an account?{' '}
                </Text>
                <Pressable onPress={navigateToLogin} disabled={loading}>
                  <Text style={themedStyles.linkText}>Sign In</Text>
                </Pressable>
              </View>
            </FadeInView>
          </View>
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
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
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
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 54,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 16,
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
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  generalErrorText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  button: {
    height: 54,
    borderRadius: 14,
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
    marginTop: 24,
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
  roleContainer: {
    gap: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#f9fafb',
  },
  roleIconContainer: {
    marginRight: 14,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: 13,
    color: '#666',
  },
  checkmark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
