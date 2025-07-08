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
  private tabId: string | null = null;

  constructor() {
    // Generate a unique session token for this browser tab
    this.generateNewSession();
  }

  private generateNewSession(): void {
    // Generate a unique token for this session with more randomness
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2);
    const random2 = Math.random().toString(36).substring(2);
    const random3 = performance.now().toString().replace('.', '');
    this.sessionToken = `${timestamp}-${random1}${random2}${random3}`;
    this.tabId = `tab_${timestamp}_${random1}`;
    
    // Store session info in sessionStorage (tab-specific)
    sessionStorage.setItem('venueFinder_sessionToken', this.sessionToken);
    sessionStorage.setItem('venueFinder_tabId', this.tabId);
  }

  private getOrCreateSessionToken(): string {
    // Try to get existing session token from sessionStorage first
    const existingToken = sessionStorage.getItem('venueFinder_sessionToken');
    const existingTabId = sessionStorage.getItem('venueFinder_tabId');
    
    if (existingToken && existingTabId) {
      this.sessionToken = existingToken;
      this.tabId = existingTabId;
      return this.sessionToken;
    }
    
    // If no existing session, generate a new one
    this.generateNewSession();
    return this.sessionToken!;
  }

  private getClientInfo() {
    return {
      ip_address: null, // Will be determined server-side
      user_agent: navigator.userAgent,
    };
  }

  async createSession(userId: string): Promise<string | null> {
    let attempts = 0;
    const maxAttempts = 3;
    
    // Ensure we have a session token
    const sessionToken = this.getOrCreateSessionToken();
    
    while (attempts < maxAttempts) {
      try {
        const { data, error } = await supabase.rpc('create_user_session', {
          p_user_id: userId,
          p_session_token: sessionToken,
          p_ip_address: null, // Will be determined server-side
          p_user_agent: navigator.userAgent,
        });

        if (error) {
          // Check if it's a duplicate key error
          if (error.code === '23505' && error.details?.includes('session_token')) {
            console.warn(`Session token conflict, regenerating... (attempt ${attempts + 1})`);
            this.generateNewSession();
            attempts++;
            continue;
          }
          console.error('Error creating session:', error);
          return null;
        }

        console.log(`Session created for tab ${this.tabId}: ${sessionToken}`);
        return data;
      } catch (error) {
        console.error('Error creating session:', error);
        return null;
      }
    }
    
    console.error('Failed to create session after maximum attempts');
    return null;
  }

  async updateSessionActivity(): Promise<boolean> {
    const sessionToken = this.getOrCreateSessionToken();

    try {
      const { data, error } = await supabase.rpc('update_session_activity', {
        p_session_token: sessionToken,
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
    const sessionToken = this.getOrCreateSessionToken();

    try {
      const { data, error } = await supabase.rpc('end_user_session', {
        p_session_token: sessionToken,
        p_ip_address: null,
      });

      if (error) {
        console.error('Error ending session:', error);
        return false;
      }

      // Clear session data from this tab
      sessionStorage.removeItem('venueFinder_sessionToken');
      sessionStorage.removeItem('venueFinder_tabId');
      this.sessionToken = null;
      this.tabId = null;

      console.log('Session ended for this tab');
      return data;
    } catch (error) {
      console.error('Error ending session:', error);
      return false;
    }
  }

  async logPageView(userId: string, pageData: PageViewData): Promise<string | null> {
    const sessionToken = this.getOrCreateSessionToken();

    try {
      const { data, error } = await supabase.rpc('log_page_view', {
        page_url: pageData.page_path,
        referrer: pageData.referrer || null,
        user_id: userId,
        view_duration: pageData.view_duration || null,
        session_token: sessionToken, // Pass session token
      });

      if (error) {
        // If function doesn't exist, try inserting directly into page_views table
        if (error.code === 'PGRST202') {
          console.warn('log_page_view function not found, using direct insert');
          const { data: insertData, error: insertError } = await supabase
            .from('page_views')
            .insert([{
              page_url: pageData.page_path,
              referrer: pageData.referrer || null,
              user_id: userId,
              view_duration: pageData.view_duration || null,
              session_token: sessionToken, // Add session token to direct insert
            }])
            .select()
            .single();
          
          if (insertError) {
            console.error('Error logging page view via direct insert:', insertError);
            return null;
          }
          return insertData?.id || null;
        }
        
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
    const sessionToken = this.getOrCreateSessionToken();

    try {
      // First try the new function signature
      const { data, error } = await supabase.rpc('log_user_activity', {
        activity_type: activityData.activity_type,
        details: JSON.stringify(activityData.activity_data || {}),
        ip_address: null,
        user_id: userId,
        session_token: sessionToken, // Pass session token
      });

      if (error) {
        // If function doesn't exist, try inserting directly into activity_logs table
        if (error.code === 'PGRST202') {
          console.warn('log_user_activity function not found, using direct insert');
          const { data: insertData, error: insertError } = await supabase
            .from('activity_logs')
            .insert([{
              activity_type: activityData.activity_type,
              details: JSON.stringify(activityData.activity_data || {}),
              user_id: userId,
              ip_address: null,
              session_token: sessionToken, // Add session token to direct insert
            }])
            .select()
            .single();
          
          if (insertError) {
            console.error('Error logging activity via direct insert:', insertError);
            return null;
          }
          return insertData?.id || null;
        }
        
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
    return this.getOrCreateSessionToken();
  }
}

export const sessionService = new SessionService(); 