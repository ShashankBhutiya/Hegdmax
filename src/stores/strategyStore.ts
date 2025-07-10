import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Strategy, StrategyAnalysis, StrategyTemplate } from '../types';

interface StrategyState {
  strategies: Strategy[];
  templates: StrategyTemplate[];
  currentStrategy: Strategy | null;
  currentAnalysis: StrategyAnalysis | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchStrategies: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  createStrategy: (strategy: Omit<Strategy, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStrategy: (id: string, updates: Partial<Strategy>) => Promise<void>;
  deleteStrategy: (id: string) => Promise<void>;
  setCurrentStrategy: (strategy: Strategy | null) => void;
  analyzeStrategy: (strategy: Strategy) => Promise<StrategyAnalysis>;
  clearError: () => void;
}

export const useStrategyStore = create<StrategyState>((set, get) => ({
  strategies: [],
  templates: [],
  currentStrategy: null,
  currentAnalysis: null,
  isLoading: false,
  error: null,

  fetchStrategies: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('user_strategies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const strategies: Strategy[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        underlyingSymbol: item.underlying_symbol,
        underlyingPrice: item.underlying_price,
        positions: item.positions,
        riskMetrics: item.risk_metrics,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      set({ strategies, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('strategy_templates')
        .select('*')
        .eq('is_public', true)
        .order('name');

      if (error) throw error;

      const templates: StrategyTemplate[] = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        strategyType: item.strategy_type,
        positions: item.positions,
        isPublic: item.is_public,
        createdBy: item.created_by || undefined,
      }));

      set({ templates, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createStrategy: async (strategyData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_strategies')
        .insert({
          user_id: user.id,
          name: strategyData.name,
          underlying_symbol: strategyData.underlyingSymbol,
          underlying_price: strategyData.underlyingPrice,
          positions: strategyData.positions,
          risk_metrics: strategyData.riskMetrics,
        })
        .select()
        .single();

      if (error) throw error;

      const newStrategy: Strategy = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        underlyingSymbol: data.underlying_symbol,
        underlyingPrice: data.underlying_price,
        positions: data.positions,
        riskMetrics: data.risk_metrics,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      set(state => ({ 
        strategies: [newStrategy, ...state.strategies],
        isLoading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateStrategy: async (id: string, updates: Partial<Strategy>) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('user_strategies')
        .update({
          name: updates.name,
          underlying_symbol: updates.underlyingSymbol,
          underlying_price: updates.underlyingPrice,
          positions: updates.positions,
          risk_metrics: updates.riskMetrics,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedStrategy: Strategy = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        underlyingSymbol: data.underlying_symbol,
        underlyingPrice: data.underlying_price,
        positions: data.positions,
        riskMetrics: data.risk_metrics,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      set(state => ({
        strategies: state.strategies.map(s => s.id === id ? updatedStrategy : s),
        currentStrategy: state.currentStrategy?.id === id ? updatedStrategy : state.currentStrategy,
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteStrategy: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('user_strategies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        strategies: state.strategies.filter(s => s.id !== id),
        currentStrategy: state.currentStrategy?.id === id ? null : state.currentStrategy,
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  setCurrentStrategy: (strategy: Strategy | null) => {
    set({ currentStrategy: strategy, currentAnalysis: null });
  },

  analyzeStrategy: async (strategy: Strategy): Promise<StrategyAnalysis> => {
    set({ isLoading: true, error: null });
    
    try {
      // Import the analysis logic
      const { OptionStrategy } = await import('../utils/optionCalculations');
      
      const optionStrategy = new OptionStrategy(strategy.positions);
      
      // Market parameters (these would typically come from API or user input)
      const S0 = strategy.underlyingPrice;
      const T = 21 / 365; // 21 days to expiration
      const r = 0.01; // Risk-free rate
      const sigma = 0.122; // Implied volatility

      const probabilityOfProfit = optionStrategy.probabilityOfProfit(S0, T, r, sigma);
      const riskRewardRatio = optionStrategy.riskRewardRatio(S0, T, r, sigma);
      
      // Generate payoff data
      const priceRange = Array.from({ length: 100 }, (_, i) => S0 * (0.5 + i * 0.01));
      const payoffs = priceRange.map(price => optionStrategy.netPayoff(price));
      
      const maxProfit = Math.max(...payoffs);
      const maxLoss = Math.min(...payoffs);
      
      // Find break-even points
      const breakEvenPoints: number[] = [];
      for (let i = 1; i < payoffs.length; i++) {
        if ((payoffs[i-1] <= 0 && payoffs[i] > 0) || (payoffs[i-1] > 0 && payoffs[i] <= 0)) {
          const breakEven = priceRange[i-1] + (priceRange[i] - priceRange[i-1]) * 
            Math.abs(payoffs[i-1]) / (Math.abs(payoffs[i-1]) + Math.abs(payoffs[i]));
          breakEvenPoints.push(breakEven);
        }
      }

      const analysis: StrategyAnalysis = {
        strategyId: strategy.id,
        riskMetrics: {
          probabilityOfProfit,
          riskRewardRatio,
          maxProfit,
          maxLoss,
          breakEvenPoints,
        },
        payoffData: {
          underlyingPrices: priceRange,
          payoffs,
        },
        greeks: {
          delta: 0, // Would calculate actual Greeks
          gamma: 0,
          theta: 0,
          vega: 0,
        },
      };

      set({ currentAnalysis: analysis, isLoading: false });
      return analysis;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));