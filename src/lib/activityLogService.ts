import { supabase } from './supabase';

export interface ActivityLog {
    id: string;
    venue_id: string;
    user_id: string;
    user_email: string;
    action: string;
    details: string;
    created_at: string;
}

export const ActivityLogService = {
    async logActivity(
        venueId: string,
        userId: string,
        userEmail: string,
        action: string,
        details: string
    ): Promise<void> {
        const { error } = await supabase.rpc('log_activity', {
            p_venue_id: venueId,
            p_user_id: userId,
            p_user_email: userEmail,
            p_action: action,
            p_details: details,
        });

        if (error) {
            console.error('Error logging activity:', error);
            throw error;
        }
    },

    async getLogsForVenue(venueId: string): Promise<ActivityLog[]> {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('venue_id', venueId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`Error fetching activity logs for venue ${venueId}:`, error);
            throw error;
        }

        return data || [];
    }
};