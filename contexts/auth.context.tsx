import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { AuthService } from '../services/auth.service';
import { User, UserRole } from '../types/models';

/**
 * AuthContext type definition
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
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
 * Implements session persistence across app restarts
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth state listener');
    
    const unsubscribe = AuthService.onAuthStateChanged((userData) => {
      console.log('[AuthProvider] Auth state changed:', userData ? `User: ${userData.email}` : 'No user');
      
      // Only update state if we have a definitive answer
      if (isInitialMount.current) {
        isInitialMount.current = false;
        setUser(userData);
        setLoading(false);
      } else {
        setUser(userData);
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('[AuthProvider] Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  /**
   * Sign up a new user
   */
  const signUp = async (email: string, password: string, name: string, role: UserRole): Promise<void> => {
    try {
      setLoading(true);
      await AuthService.signUp(email, password, name, role);
      // Don't set user here - let onAuthStateChanged handle it
      // This prevents race conditions between manual state update and listener
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
    // Don't set loading to false here - onAuthStateChanged will do it
  };

  /**
   * Sign in an existing user
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      await AuthService.signIn(email, password);
      // Don't set user here - let onAuthStateChanged handle it
      // This prevents race conditions between manual state update and listener
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
    // Don't set loading to false here - onAuthStateChanged will do it
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
 * Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
