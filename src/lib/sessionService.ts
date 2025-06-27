import { supabase } from './supabase';

export interface SessionInfo {
  session_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  last_activity: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface ActivitySummary {
  total_sessions: number;
  total_page_views: number;
  total_activities: number;
  last_activity: string;
  most_visited_pages: Array<{
    page_path: string;
    page_title?: string;
    visit_count: number;
  }>;
}

export interface PageViewData {
  page_path: string;
  page_title?: string;
  referrer?: string;
  view_duration?: number;
}

export interface ActivityData {
  activity_type: string;
  activity_data?: Record<string, string | number | boolean>;
}

class SessionService {
  private sessionToken: string | null = null;

  constructor() {
    // Generate a unique session token for this browser session
    this.sessionToken = this.generateSessionToken();
  }

  private generateSessionToken(): string {
    // Generate a unique token for this session
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }

  private getClientInfo() {
    return {
      ip_address: null, // Will be determined server-side
      user_agent: navigator.userAgent,
    };
  }

  async createSession(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_user_session', {
        p_user_id: userId,
        p_session_token: this.sessionToken,
        p_ip_address: null, // Will be determined server-side
        p_user_agent: navigator.userAgent,
      });

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  async updateSessionActivity(): Promise<boolean> {
    if (!this.sessionToken) return false;

    try {
      const { data, error } = await supabase.rpc('update_session_activity', {
        p_session_token: this.sessionToken,
        p_ip_address: null,
      });

      if (error) {
        console.error('Error updating session activity:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error updating session activity:', error);
      return false;
    }
  }

  async endSession(): Promise<boolean> {
    if (!this.sessionToken) return false;

    try {
      const { data, error } = await supabase.rpc('end_user_session', {
        p_session_token: this.sessionToken,
        p_ip_address: null,
      });

      if (error) {
        console.error('Error ending session:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error ending session:', error);
      return false;
    }
  }

  async logPageView(userId: string, pageData: PageViewData): Promise<string | null> {
    if (!this.sessionToken) return null;

    try {
      const { data, error } = await supabase.rpc('log_page_view', {
        p_user_id: userId,
        p_session_token: this.sessionToken,
        p_page_path: pageData.page_path,
        p_page_title: pageData.page_title || null,
        p_referrer: pageData.referrer || null,
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
        p_view_duration: pageData.view_duration || null,
      });

      if (error) {
        console.error('Error logging page view:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging page view:', error);
      return null;
    }
  }

  async logActivity(userId: string, activityData: ActivityData): Promise<string | null> {
    if (!this.sessionToken) return null;

    try {
      const { data, error } = await supabase.rpc('log_user_activity', {
        p_user_id: userId,
        p_session_token: this.sessionToken,
        p_activity_type: activityData.activity_type,
        p_activity_data: activityData.activity_data || null,
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
      });

      if (error) {
        console.error('Error logging activity:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  }

  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_session_info', {
        p_user_id: userId,
      });

      if (error) {
        console.error('Error getting user sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  async getActivitySummary(userId: string, days: number = 30): Promise<ActivitySummary | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_activity_summary', {
        p_user_id: userId,
        p_days: days,
      });

      if (error) {
        console.error('Error getting activity summary:', error);
        return null;
      }

      if (data && data.length > 0) {
        const summary = data[0];
        return {
          total_sessions: summary.total_sessions || 0,
          total_page_views: summary.total_page_views || 0,
          total_activities: summary.total_activities || 0,
          last_activity: summary.last_activity || '',
          most_visited_pages: summary.most_visited_pages || [],
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting activity summary:', error);
      return null;
    }
  }

  // Helper method to log page view with current page info
  async logCurrentPageView(userId: string): Promise<void> {
    const pageData: PageViewData = {
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || undefined,
    };

    await this.logPageView(userId, pageData);
  }

  // Helper method to log user actions
  async logUserAction(userId: string, action: string, details?: Record<string, string | number | boolean>): Promise<void> {
    const activityData: ActivityData = {
      activity_type: action,
      activity_data: details,
    };

    await this.logActivity(userId, activityData);
  }

  // Method to start tracking page views automatically
  startPageViewTracking(userId: string): () => void {
    let startTime = Date.now();

    const handlePageView = () => {
      const currentTime = Date.now();
      const viewDuration = Math.floor((currentTime - startTime) / 1000); // Convert to seconds

      this.logPageView(userId, {
        page_path: window.location.pathname,
        page_title: document.title,
        referrer: document.referrer || undefined,
        view_duration: viewDuration,
      });

      startTime = currentTime;
    };

    // Log initial page view
    handlePageView();

    // Set up page view tracking
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handlePageView();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handlePageView();
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handlePageView);

    // Return cleanup function
    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePageView);
    };
  }

  // Method to get current session token
  getSessionToken(): string | null {
    return this.sessionToken;
  }
}

export const sessionService = new SessionService(); 