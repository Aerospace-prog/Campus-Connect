import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/auth.service';
import { User } from '../types/models';

/**
 * AuthContext type definition
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

/**
 * Create the AuthContext
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Provides authentication state and methods to the app
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((userData) => {
      setUser(userData);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Sign up a new user
   */
  const signUp = async (email: string, password: string, name: string): Promise<void> => {
    try {
      setLoading(true);
      const userData = await AuthService.signUp(email, password, name);
      setUser(userData);
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in an existing user
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const userData = await AuthService.signIn(email, password);
      setUser(userData);
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await AuthService.signOut();
      setUser(null);
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if current user is an admin
   */
  const isAdmin = user?.role === 'admin';

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook - Access authentication context
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
