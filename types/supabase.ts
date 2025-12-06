export type Database = {
  public: {
    Tables: {
      status_logs: {
        Row: {
          id: number;
          created_at: string;
          status_text: string;
          is_active: boolean;
        };
        Insert: {
          status_text: string;
          is_active?: boolean;
        };
      };
      projects: {
        Row: {
          id: number;
          created_at: string;
          title: string;
          description: string;
          image_url: string | null;
          github_url: string | null;
          live_url: string | null;
          tags: string[] | null;
          display_order: number;
        };
        Insert: {
          title: string;
          description: string;
          image_url?: string | null;
          github_url?: string | null;
          live_url?: string | null;
          tags?: string[] | null;
        };
      };
      messages: {
        Row: {
          id: number;
          created_at: string;
          sender_name: string;
          sender_email: string;
          message_text: string;
          is_read: boolean;
        };
        Insert: {
          sender_name: string;
          sender_email: string;
          message_text: string;
        };
      };
       profile_settings: {
        Row: {
          id: number;
          is_looking_for_work: boolean;
          updated_at: string;
        };
        Update: {
          is_looking_for_work?: boolean;
          updated_at?: string;
        };
      };
    };
  };
};