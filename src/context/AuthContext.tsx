import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Define proper types for user profile
interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to create user profile from Supabase user
  const createUserProfile = (supabaseUser: unknown): UserProfile => ({
    id: (supabaseUser as any).id,
    email: (supabaseUser as any).email || '',
    full_name: (supabaseUser as any).user_metadata?.full_name || (supabaseUser as any).user_metadata?.name,
    avatar_url: (supabaseUser as any).user_metadata?.avatar_url,
    phone: (supabaseUser as any).phone,
    created_at: (supabaseUser as any).created_at,
    updated_at: (supabaseUser as any).updated_at || (supabaseUser as any).created_at
  });

  // Sync user profile with database
  const syncUserProfile = async (supabaseUser: unknown) => {
    try {
      const userProfile = createUserProfile(supabaseUser);
      
      // Check if user profile exists in database
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', (supabaseUser as any).id)
        .single();

      if (!existingProfile) {
        // Create new user profile
        const { error } = await supabase
          .from('user_profiles')
          .insert([{
            id: userProfile.id,
            email: userProfile.email,
            full_name: userProfile.full_name,
            avatar_url: userProfile.avatar_url,
            phone: userProfile.phone
          }]);

        if (error) {
          console.error('Error creating user profile:', error);
        }
      } else {
        // Update existing profile with latest metadata
        const { error } = await supabase
          .from('user_profiles')
          .update({
            full_name: userProfile.full_name,
            avatar_url: userProfile.avatar_url,
            phone: userProfile.phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', (supabaseUser as any).id);

        if (error) {
          console.error('Error updating user profile:', error);
        }
      }

      setUser(userProfile);
    } catch (error) {
      console.error('Error syncing user profile:', error);
      // Still set user even if sync fails
      setUser(createUserProfile(supabaseUser));
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await syncUserProfile(session.user);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.user) {
              await syncUserProfile(session.user);
            } else {
              setUser(null);
            }
            setLoading(false);
          }
        );

        setLoading(false);
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google sign-in error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Email sign-in error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, phone?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone
          }
        }
      });

      if (error) {
        console.error('Email sign-up error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 