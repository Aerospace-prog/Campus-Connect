import { useAuth } from '@/contexts/auth.context';
import { useTheme } from '@/contexts/theme.context';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // Create themed styles
  const themedStyles = useMemo(() => ({
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
    button: { 
      ...styles.button, 
      backgroundColor: colors.primary,
      ...theme.shadows.md,
    },
    buttonDisabled: { 
      backgroundColor: colors.textDisabled,
      ...theme.shadows.none,
    },
    footerText: { ...styles.footerText, color: colors.textSecondary },
    linkText: { ...styles.linkText, color: colors.primary },
  }), [colors, theme]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validate
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validate
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
      // Navigation will happen automatically via _layout.tsx when auth state changes
    } catch (error: any) {
      let errorMessage = 'Failed to sign in. Please try again.';

      if (error.message) {
        // Parse Firebase error messages
        if (error.message.includes('user-not-found') || error.message.includes('wrong-password')) {
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

  return (
    <KeyboardAvoidingView
      style={themedStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>

          <View style={styles.header}>
            <Text style={themedStyles.title}>Welcome Back</Text>
            <Text style={themedStyles.subtitle}>Sign in to continue to CampusConnect</Text>
          </View>


          <View style={styles.form}>

            <View style={styles.inputContainer}>
              <Text style={themedStyles.label}>Email</Text>
              <TextInput
                style={[themedStyles.input, errors.email && themedStyles.inputError]}
                placeholder="Enter your email"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
              {errors.email && <Text style={themedStyles.errorText}>{errors.email}</Text>}
            </View>


            <View style={styles.inputContainer}>
              <Text style={themedStyles.label}>Password</Text>
              <TextInput
                style={[themedStyles.input, errors.password && themedStyles.inputError]}
                placeholder="Enter your password"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
              />
              {errors.password && <Text style={themedStyles.errorText}>{errors.password}</Text>}
            </View>


            {errors.general && (
              <View style={themedStyles.generalErrorContainer}>
                <Text style={themedStyles.generalErrorText}>{errors.general}</Text>
              </View>
            )}


            <TouchableOpacity
              style={[themedStyles.button, loading && themedStyles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>


            <View style={styles.footer}>
              <Text style={themedStyles.footerText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={navigateToSignup} disabled={loading}>
                <Text style={themedStyles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#ff3b30',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 4,
  },
  generalErrorContainer: {
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff3b30',
  },
  generalErrorText: {
    fontSize: 14,
    color: '#ff3b30',
  },
  button: {
    height: 50,
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#b0b0b0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a7ea4',
  },
});
