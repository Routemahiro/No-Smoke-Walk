'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthService, AdminUser } from '@/lib/auth';

interface AuthState {
  user: User | null;
  adminUser: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    adminUser: null,
    isAdmin: false,
    loading: true,
    initialized: false,
  });

  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const session = await AuthService.getSession();
        const user = session?.user ?? null;
        
        if (user && mounted) {
          const [isAdmin, adminUser] = await Promise.all([
            AuthService.isAdmin(user),
            AuthService.getAdminUser(user),
          ]);

          setAuthState({
            user,
            adminUser,
            isAdmin,
            loading: false,
            initialized: true,
          });
        } else if (mounted) {
          setAuthState({
            user: null,
            adminUser: null,
            isAdmin: false,
            loading: false,
            initialized: true,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState({
            user: null,
            adminUser: null,
            isAdmin: false,
            loading: false,
            initialized: true,
          });
        }
      }
    };

    initializeAuth();

    // Listen to auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (user) => {
      if (!mounted) return;

      if (user) {
        try {
          const [isAdmin, adminUser] = await Promise.all([
            AuthService.isAdmin(user),
            AuthService.getAdminUser(user),
          ]);

          setAuthState({
            user,
            adminUser,
            isAdmin,
            loading: false,
            initialized: true,
          });
        } catch (error) {
          console.error('Auth state change error:', error);
          setAuthState({
            user,
            adminUser: null,
            isAdmin: false,
            loading: false,
            initialized: true,
          });
        }
      } else {
        setAuthState({
          user: null,
          adminUser: null,
          isAdmin: false,
          loading: false,
          initialized: true,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string) => {
    setSignInLoading(true);
    setSignInError(null);

    try {
      const result = await AuthService.signInWithEmail(email);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setSignInError(errorMessage);
      throw error;
    } finally {
      setSignInLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      // State will be updated by the auth state change listener
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const clearSignInError = () => {
    setSignInError(null);
  };

  return {
    ...authState,
    signIn,
    signOut,
    signInLoading,
    signInError,
    clearSignInError,
  };
}