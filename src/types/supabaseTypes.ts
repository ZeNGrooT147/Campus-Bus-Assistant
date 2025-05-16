
import { Database as SupabaseDatabase } from '@/integrations/supabase/types';

/**
 * Extend the original Database type with our custom tables
 */
export interface ExtendedDatabase extends SupabaseDatabase {
  public: {
    Tables: {
      driver_response_pending: {
        Row: {
          id: string;
          topic_id: string;
          region: string;
          title: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          region: string;
          title: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          region?: string;
          title?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "driver_response_pending_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "voting_topics";
            referencedColumns: ["id"];
          }
        ];
      };
    } & SupabaseDatabase['public']['Tables'];
    Views: SupabaseDatabase['public']['Views'];
    Functions: SupabaseDatabase['public']['Functions'] & {
      get_expired_driver_requests: {
        Args: { p_current_time: string };
        Returns: {
          id: string;
          topic_id: string;
          region: string;
          title: string;
          expires_at: string;
        }[];
      };
      get_pending_response: {
        Args: { topic_id_param: string };
        Returns: {
          id: string;
          topic_id: string;
          region: string;
          title: string;
          expires_at: string;
        }[];
      };
      delete_driver_response: {
        Args: { request_id: string };
        Returns: void;
      };
      clear_driver_pending_responses: {
        Args: { topic_id_param: string };
        Returns: void;
      };
      create_driver_response_pending: {
        Args: { 
          topic_id_param: string;
          region_param: string;
          title_param: string;
          expires_at_param: string;
        };
        Returns: string;
      };
    };
    Enums: SupabaseDatabase['public']['Enums'];
    CompositeTypes: SupabaseDatabase['public']['CompositeTypes'];
  };
}
