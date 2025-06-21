import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uledqmfntmblwreoaksi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWRxbWZudG1ibHdyZW9ha3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTU2MjEsImV4cCI6MjA2NjA3MTYyMX0.lwusINGkcdk8DZAClao4HYCLkfDriN3iDc9VY3Lqiz4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User profile interface
interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Auth helper functions
export const auth = {
  // Sign in with Google
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  },

  // Sign in with email/password
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign up with email/password
  signUpWithEmail: async (email: string, password: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone: phone || null
        }
      }
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get user session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// User profile functions
export const userProfile = {
  // Create or update user profile
  upsertProfile: async (userId: string, profile: Partial<UserProfile>) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        ...profile,
        updated_at: new Date().toISOString()
      });
    return { data, error };
  },

  // Get user profile
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // Update user profile
  updateProfile: async (userId: string, updates: Partial<UserProfile>) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    return { data, error };
  }
};

export default supabase; 