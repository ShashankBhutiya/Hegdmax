import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          risk_tolerance: 'conservative' | 'moderate' | 'aggressive' | null;
          default_portfolio_size: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          risk_tolerance?: 'conservative' | 'moderate' | 'aggressive' | null;
          default_portfolio_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          risk_tolerance?: 'conservative' | 'moderate' | 'aggressive' | null;
          default_portfolio_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_strategies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          underlying_symbol: string;
          underlying_price: number;
          positions: any;
          risk_metrics: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          underlying_symbol: string;
          underlying_price: number;
          positions: any;
          risk_metrics?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          underlying_symbol?: string;
          underlying_price?: number;
          positions?: any;
          risk_metrics?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      strategy_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          strategy_type: string;
          positions: any;
          created_by: string | null;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          strategy_type: string;
          positions: any;
          created_by?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          strategy_type?: string;
          positions?: any;
          created_by?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
      };
      option_chains: {
        Row: {
          id: string;
          symbol: string;
          expiration_date: string;
          strike_price: number;
          option_type: 'call' | 'put';
          bid_price: number | null;
          ask_price: number | null;
          volume: number | null;
          open_interest: number | null;
          implied_volatility: number | null;
          delta: number | null;
          gamma: number | null;
          theta: number | null;
          vega: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          expiration_date: string;
          strike_price: number;
          option_type: 'call' | 'put';
          bid_price?: number | null;
          ask_price?: number | null;
          volume?: number | null;
          open_interest?: number | null;
          implied_volatility?: number | null;
          delta?: number | null;
          gamma?: number | null;
          theta?: number | null;
          vega?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          expiration_date?: string;
          strike_price?: number;
          option_type?: 'call' | 'put';
          bid_price?: number | null;
          ask_price?: number | null;
          volume?: number | null;
          open_interest?: number | null;
          implied_volatility?: number | null;
          delta?: number | null;
          gamma?: number | null;
          theta?: number | null;
          vega?: number | null;
          created_at?: string;
        };
      };
    };
  };
};