export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          severity: string
          target_role: Database["public"]["Enums"]["user_role"] | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          severity: string
          target_role?: Database["public"]["Enums"]["user_role"] | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          severity?: string
          target_role?: Database["public"]["Enums"]["user_role"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_cards: {
        Row: {
          arrivaltime: string | null
          busimage: string | null
          capacity: number
          created_at: string
          currentoccupancy: number | null
          departuretime: string | null
          driver: Json
          id: string
          name: string
          number: string
          route: string
          status: string | null
          stops: string[]
          updated_at: string
        }
        Insert: {
          arrivaltime?: string | null
          busimage?: string | null
          capacity?: number
          created_at?: string
          currentoccupancy?: number | null
          departuretime?: string | null
          driver?: Json
          id?: string
          name: string
          number: string
          route: string
          status?: string | null
          stops?: string[]
          updated_at?: string
        }
        Update: {
          arrivaltime?: string | null
          busimage?: string | null
          capacity?: number
          created_at?: string
          currentoccupancy?: number | null
          departuretime?: string | null
          driver?: Json
          id?: string
          name?: string
          number?: string
          route?: string
          status?: string | null
          stops?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      bus_trips: {
        Row: {
          cancellation_reason: string | null
          created_at: string
          driver_id: string | null
          end_time: string | null
          id: string
          schedule_id: string | null
          start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string
          driver_id?: string | null
          end_time?: string | null
          id?: string
          schedule_id?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string
          driver_id?: string | null
          end_time?: string | null
          id?: string
          schedule_id?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bus_trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_trips_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          id: string
          name: string
          bus_number: string
          capacity: number
          assigned_driver: string | null
          status: string
          route: string | null
          route_id: string | null
          current_location: string | null
          current_passengers: number | null
          created_at: string
          updated_at: string
          departure_time: string | null
          arrival_time: string | null
          next_departure: string | null
          stops: string[] | null
          bus_image: string | null
          driver: {
            name: string
            experience: string
            phone: string
            photo: string
          } | null
        }
        Insert: {
          id?: string
          name: string
          bus_number: string
          capacity: number
          assigned_driver?: string | null
          status?: string
          route?: string | null
          route_id?: string | null
          current_location?: string | null
          current_passengers?: number | null
          created_at?: string
          updated_at?: string
          departure_time?: string | null
          arrival_time?: string | null
          next_departure?: string | null
          stops?: string[] | null
          bus_image?: string | null
          driver?: {
            name: string
            experience: string
            phone: string
            photo: string
          } | null
        }
        Update: {
          id?: string
          name?: string
          bus_number?: string
          capacity?: number
          assigned_driver?: string | null
          status?: string
          route?: string | null
          route_id?: string | null
          current_location?: string | null
          current_passengers?: number | null
          created_at?: string
          updated_at?: string
          departure_time?: string | null
          arrival_time?: string | null
          next_departure?: string | null
          stops?: string[] | null
          bus_image?: string | null
          driver?: {
            name: string
            experience: string
            phone: string
            photo: string
          } | null
        }
        Relationships: [
          {
            foreignKeyName: "buses_assigned_driver_fkey"
            columns: ["assigned_driver"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buses_route_id_fkey"
            columns: ["route_id"]
            referencedRelation: "routes"
            referencedColumns: ["id"]
          }
        ]
      }
      complaint_responses: {
        Row: {
          complaint_id: string | null
          created_at: string
          id: string
          message: string
          responder_id: string | null
        }
        Insert: {
          complaint_id?: string | null
          created_at?: string
          id?: string
          message: string
          responder_id?: string | null
        }
        Update: {
          complaint_id?: string | null
          created_at?: string
          id?: string
          message?: string
          responder_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaint_responses_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_responses_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          bus_id: string | null
          complaint_type: string
          coordinator_notes: string | null
          created_at: string
          description: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          student_id: string | null
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          bus_id?: string | null
          complaint_type: string
          coordinator_notes?: string | null
          created_at?: string
          description: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          student_id?: string | null
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          bus_id?: string | null
          complaint_type?: string
          coordinator_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          student_id?: string | null
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "bus_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_response_pending: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          region: string
          title: string
          topic_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          region: string
          title: string
          topic_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          region?: string
          title?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_response_pending_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "voting_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          profile_photo_url: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          updated_at: string
          usn: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name: string
          phone?: string | null
          profile_photo_url?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
          usn?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          profile_photo_url?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
          usn?: string | null
        }
        Relationships: []
      }
      route_stops: {
        Row: {
          created_at: string
          estimated_arrival_offset: number | null
          id: string
          route_id: string | null
          stop_name: string
          stop_order: number
        }
        Insert: {
          created_at?: string
          estimated_arrival_offset?: number | null
          id?: string
          route_id?: string | null
          stop_name: string
          stop_order: number
        }
        Update: {
          created_at?: string
          estimated_arrival_offset?: number | null
          id?: string
          route_id?: string | null
          stop_name?: string
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string
          description: string | null
          distance: number | null
          end_location: string
          estimated_duration: number | null
          id: string
          name: string
          start_location: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          distance?: number | null
          end_location: string
          estimated_duration?: number | null
          id?: string
          name: string
          start_location: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          distance?: number | null
          end_location?: string
          estimated_duration?: number | null
          id?: string
          name?: string
          start_location?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          bus_id: string | null
          created_at: string
          days_of_week: string[]
          departure_time: string
          id: string
          is_active: boolean | null
          route_id: string | null
          updated_at: string
        }
        Insert: {
          bus_id?: string | null
          created_at?: string
          days_of_week: string[]
          departure_time: string
          id?: string
          is_active?: boolean | null
          route_id?: string | null
          updated_at?: string
        }
        Update: {
          bus_id?: string | null
          created_at?: string
          days_of_week?: string[]
          departure_time?: string
          id?: string
          is_active?: boolean | null
          route_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      student_bus_subscriptions: {
        Row: {
          created_at: string
          id: string
          schedule_id: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          schedule_id?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          schedule_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_bus_subscriptions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_bus_subscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          option_id: string | null
          student_id: string | null
          topic_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          option_id?: string | null
          student_id?: string | null
          topic_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string | null
          student_id?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "voting_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "voting_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_options: {
        Row: {
          created_at: string
          id: string
          option_text: string
          topic_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          option_text: string
          topic_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          option_text?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voting_options_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "voting_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_topics: {
        Row: {
          bus_id: string | null
          created_at: string
          created_by: string | null
          description: string
          driver_id: string | null
          end_date: string
          id: string
          rejection_reason: string | null
          route_id: string | null
          schedule_id: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          bus_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          driver_id?: string | null
          end_date: string
          id?: string
          rejection_reason?: string | null
          route_id?: string | null
          schedule_id?: string | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          bus_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          driver_id?: string | null
          end_date?: string
          id?: string
          rejection_reason?: string | null
          route_id?: string | null
          schedule_id?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voting_topics_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voting_topics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voting_topics_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voting_topics_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voting_topics_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_expired_driver_requests: {
        Args: { p_current_time: string }
        Returns: {
          id: string
          topic_id: string
          region: string
          title: string
          expires_at: string
        }[]
      }
      get_topic_bus_details: {
        Args: { topic_id: string }
        Returns: {
          bus_id: string
          bus_number: string
        }[]
      }
    }
    Enums: {
      user_role: "student" | "driver" | "coordinator" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["student", "driver", "coordinator", "admin"],
    },
  },
} as const

export type Complaint = {
  id: string;
  student_id: string;
  bus_id?: string;
  complaint_type: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  created_at: string;
  responses?: {
    id: string;
    message: string;
    timestamp: string;
    timeAgo: string;
  }[];
};
