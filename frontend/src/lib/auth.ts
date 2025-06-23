'use client';

import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export class AuthService {
  // Sign in with email (magic link)
  static async signInWithEmail(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/dashboard`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Check your email for the login link!' };
  }

  // Sign out
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Check if user is admin
  static async isAdmin(user: User): Promise<boolean> {
    if (!user?.email) return false;

    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role === 'admin';
  }

  // Get admin user details
  static async getAdminUser(user: User): Promise<AdminUser | null> {
    if (!user?.email) return null;

    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (error || !data) {
      return null;
    }

    return data as AdminUser;
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  }

  // Get session
  static async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
}