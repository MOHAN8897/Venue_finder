// Secure Session Management Service
// Avoids storing sensitive user data in localStorage/sessionStorage

import { supabase } from './supabase';

export interface SecureSessionInfo {
  isActive: boolean;
  lastActivity: number;
  tabId: string;
}

class SecureSessionService {
  private sessionKey = 'venueFinder_secure_session';
  private activityKey = 'venueFinder_last_activity';
  private tabId: string;

  constructor() {
    this.tabId = this.generateTabId();
  }

  private generateTabId(): string {
    return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Store only non-sensitive session info
  setSessionActive(): void {
    const sessionInfo: SecureSessionInfo = {
      isActive: true,
      lastActivity: Date.now(),
      tabId: this.tabId
    };
    
    // Only store minimal session state
    localStorage.setItem(this.sessionKey, JSON.stringify(sessionInfo));
    localStorage.setItem(this.activityKey, Date.now().toString());
  }

  // Check if session is active without loading sensitive data
  isSessionActive(): boolean {
    try {
      const sessionInfo = localStorage.getItem(this.sessionKey);
      if (!sessionInfo) return false;
      
      const parsed = JSON.parse(sessionInfo) as SecureSessionInfo;
      const lastActivity = localStorage.getItem(this.activityKey);
      
      // Check if session is recent (within 24 hours)
      const isRecent = lastActivity && (Date.now() - parseInt(lastActivity)) < 24 * 60 * 60 * 1000;
      
      return parsed.isActive && isRecent;
    } catch {
      return false;
    }
  }

  // Clear session data
  clearSession(): void {
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.activityKey);
    // Clear any other session-related data
    localStorage.removeItem('venueFinder_user');
    localStorage.removeItem('venueFinder_session');
    sessionStorage.removeItem('venueFinder_session');
  }

  // Update activity timestamp
  updateActivity(): void {
    if (this.isSessionActive()) {
      localStorage.setItem(this.activityKey, Date.now().toString());
    }
  }

  // Validate session with Supabase
  async validateSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return !!(session && session.user);
    } catch {
      return false;
    }
  }

  // Get current user from Supabase (not localStorage)
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      
      // Fetch profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      return profile;
    } catch {
      return null;
    }
  }
}

export const secureSessionService = new SecureSessionService(); 