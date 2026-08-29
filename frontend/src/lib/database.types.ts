// Auto-generated from the Supabase project schema
// (mcp__Supabase__generate_typescript_types). Regenerate after schema
// changes rather than hand-editing.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.15'
  }
  public: {
    Tables: {
      currencies: {
        Row: {
          code: string
          is_default: boolean
          name: string
          symbol: string
        }
        Insert: {
          code: string
          is_default?: boolean
          name: string
          symbol: string
        }
        Update: {
          code?: string
          is_default?: boolean
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      expense_comments: {
        Row: {
          content: string
          created_at: string
          expense_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expense_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expense_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'expense_comments_expense_id_fkey'
            columns: ['expense_id']
            isOneToOne: false
            referencedRelation: 'expenses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expense_comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      expense_audit: {
        Row: {
          action: Database['public']['Enums']['audit_action']
          changed_by: string
          created_at: string
          expense_id: string
          id: string
          snapshot: Json
        }
        Insert: {
          action: Database['public']['Enums']['audit_action']
          changed_by: string
          created_at?: string
          expense_id: string
          id?: string
          snapshot: Json
        }
        Update: {
          action?: Database['public']['Enums']['audit_action']
          changed_by?: string
          created_at?: string
          expense_id?: string
          id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'expense_audit_changed_by_fkey'
            columns: ['changed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expense_audit_expense_id_fkey'
            columns: ['expense_id']
            isOneToOne: false
            referencedRelation: 'expenses'
            referencedColumns: ['id']
          },
        ]
      }
      expense_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          expense_id: string
          id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          expense_id: string
          id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          expense_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'expense_items_expense_id_fkey'
            columns: ['expense_id']
            isOneToOne: false
            referencedRelation: 'expenses'
            referencedColumns: ['id']
          },
        ]
      }
      expense_payers: {
        Row: {
          amount: number
          expense_id: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          expense_id: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          expense_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'expense_payers_expense_id_fkey'
            columns: ['expense_id']
            isOneToOne: false
            referencedRelation: 'expenses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expense_payers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      expense_splits: {
        Row: {
          amount: number
          expense_id: string
          expense_item_id: string | null
          id: string
          percentage: number | null
          user_id: string
        }
        Insert: {
          amount: number
          expense_id: string
          expense_item_id?: string | null
          id?: string
          percentage?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          expense_id?: string
          expense_item_id?: string | null
          id?: string
          percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'expense_splits_expense_id_fkey'
            columns: ['expense_id']
            isOneToOne: false
            referencedRelation: 'expenses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expense_splits_expense_item_id_fkey'
            columns: ['expense_item_id']
            isOneToOne: false
            referencedRelation: 'expense_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expense_splits_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      expenses: {
        Row: {
          category: Database['public']['Enums']['expense_category']
          created_at: string
          created_by: string
          currency_code: string
          deleted_at: string | null
          description: string | null
          expense_date: string
          group_id: string
          id: string
          paid_by: string
          split_type: Database['public']['Enums']['split_type']
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          category?: Database['public']['Enums']['expense_category']
          created_at?: string
          created_by: string
          currency_code?: string
          deleted_at?: string | null
          description?: string | null
          expense_date: string
          group_id: string
          id?: string
          paid_by: string
          split_type?: Database['public']['Enums']['split_type']
          title: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          category?: Database['public']['Enums']['expense_category']
          created_at?: string
          created_by?: string
          currency_code?: string
          deleted_at?: string | null
          description?: string | null
          expense_date?: string
          group_id?: string
          id?: string
          paid_by?: string
          split_type?: Database['public']['Enums']['split_type']
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'expenses_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expenses_currency_code_fkey'
            columns: ['currency_code']
            isOneToOne: false
            referencedRelation: 'currencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'expenses_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expenses_paid_by_fkey'
            columns: ['paid_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          is_active: boolean
          joined_at: string
          role: Database['public']['Enums']['member_role']
          user_id: string
        }
        Insert: {
          group_id: string
          is_active?: boolean
          joined_at?: string
          role?: Database['public']['Enums']['member_role']
          user_id: string
        }
        Update: {
          group_id?: string
          is_active?: boolean
          joined_at?: string
          role?: Database['public']['Enums']['member_role']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          currency_code: string
          deleted_at: string | null
          description: string | null
          id: string
          invite_code: string
          name: string
          type: Database['public']['Enums']['group_type']
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          currency_code?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          invite_code?: string
          name: string
          type?: Database['public']['Enums']['group_type']
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency_code?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
          type?: Database['public']['Enums']['group_type']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'groups_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'groups_currency_code_fkey'
            columns: ['currency_code']
            isOneToOne: false
            referencedRelation: 'currencies'
            referencedColumns: ['code']
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          currency_code: string
          from_user_id: string
          group_id: string
          id: string
          note: string | null
          payment_method: Database['public']['Enums']['payment_method']
          razorpay_payment_id: string | null
          to_user_id: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string
          currency_code?: string
          from_user_id: string
          group_id: string
          id?: string
          note?: string | null
          payment_method?: Database['public']['Enums']['payment_method']
          razorpay_payment_id?: string | null
          to_user_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          currency_code?: string
          from_user_id?: string
          group_id?: string
          id?: string
          note?: string | null
          payment_method?: Database['public']['Enums']['payment_method']
          razorpay_payment_id?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_currency_code_fkey'
            columns: ['currency_code']
            isOneToOne: false
            referencedRelation: 'currencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'payments_from_user_id_fkey'
            columns: ['from_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_to_user_id_fkey'
            columns: ['to_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      settlements: {
        Row: {
          amount: number
          computed_at: string
          currency_code: string
          from_user_id: string
          group_id: string
          id: string
          to_user_id: string
        }
        Insert: {
          amount: number
          computed_at?: string
          currency_code: string
          from_user_id: string
          group_id: string
          id?: string
          to_user_id: string
        }
        Update: {
          amount?: number
          computed_at?: string
          currency_code?: string
          from_user_id?: string
          group_id?: string
          id?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'settlements_currency_code_fkey'
            columns: ['currency_code']
            isOneToOne: false
            referencedRelation: 'currencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'settlements_from_user_id_fkey'
            columns: ['from_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'settlements_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'settlements_to_user_id_fkey'
            columns: ['to_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      group_activity: {
        Row: {
          activity_type: 'expense_created' | 'expense_edited' | 'payment_recorded'
          actor_id: string | null
          entity_id: string | null
          entity_title: string | null
          group_id: string | null
          occurred_at: string | null
          total_amount: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      confirm_payment: {
        Args: { p_payment_id: string }
        Returns: {
          amount: number
          confirmed_at: string | null
          created_at: string
          currency_code: string
          from_user_id: string
          group_id: string
          id: string
          note: string | null
          payment_method: Database['public']['Enums']['payment_method']
          razorpay_payment_id: string | null
          to_user_id: string
        }
      }
      create_payment: {
        Args: {
          p_amount: number
          p_currency_code?: string
          p_from_user_id: string
          p_group_id: string
          p_note?: string
          p_payment_method?: Database['public']['Enums']['payment_method']
          p_to_user_id: string
        }
        Returns: {
          amount: number
          confirmed_at: string | null
          created_at: string
          currency_code: string
          from_user_id: string
          group_id: string
          id: string
          note: string | null
          payment_method: Database['public']['Enums']['payment_method']
          razorpay_payment_id: string | null
          to_user_id: string
        }
      }
      generate_invite_code: { Args: never; Returns: string }
      group_analytics: { Args: { p_group_id: string }; Returns: Json }
      is_expense_group_member: {
        Args: { p_expense_id: string }
        Returns: boolean
      }
      is_group_admin: { Args: { p_group_id: string }; Returns: boolean }
      is_group_member: { Args: { p_group_id: string }; Returns: boolean }
      join_group: { Args: { p_invite_code: string }; Returns: string }
      leave_group: { Args: { p_group_id: string }; Returns: undefined }
      list_group_summaries: {
        Args: never
        Returns: {
          currency_code: string
          id: string
          member_count: number
          name: string
          owed_to_you: number
          total_expenses: number
          type: string
          you_owe: number
        }[]
      }
      personal_dashboard: { Args: never; Returns: Json }
      recalculate_settlements: {
        Args: { p_group_id: string }
        Returns: undefined
      }
      regenerate_invite_code: { Args: { p_group_id: string }; Returns: string }
      remove_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      audit_action: 'created' | 'updated' | 'deleted' | 'restored'
      expense_category: 'food' | 'travel' | 'accommodation' | 'utilities' | 'entertainment' | 'other'
      group_type: 'travel' | 'roommates' | 'friends' | 'dinner' | 'other'
      member_role: 'admin' | 'member'
      payment_method: 'cash' | 'upi' | 'razorpay' | 'bank_transfer' | 'other'
      split_type: 'equal' | 'percentage' | 'exact' | 'itemized'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
