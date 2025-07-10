export interface User {
  id: string;
  email: string;
  displayName?: string;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  defaultPortfolioSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OptionPosition {
  id: string;
  optionType: 'call' | 'put';
  action: 'buy' | 'sell';
  strike: number;
  premium: number;
  quantity: number;
  expiration?: string;
}

export interface Strategy {
  id: string;
  userId: string;
  name: string;
  underlyingSymbol: string;
  underlyingPrice: number;
  positions: OptionPosition[];
  riskMetrics?: RiskMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface RiskMetrics {
  probabilityOfProfit: number;
  riskRewardRatio: number;
  maxProfit: number;
  maxLoss: number;
  breakEvenPoints: number[];
  expectedReturn?: number;
  sharpeRatio?: number;
}

export interface StrategyAnalysis {
  strategyId: string;
  riskMetrics: RiskMetrics;
  payoffData: {
    underlyingPrices: number[];
    payoffs: number[];
  };
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
}

export interface OptionChain {
  id: string;
  symbol: string;
  expirationDate: string;
  strikePrice: number;
  optionType: 'call' | 'put';
  bidPrice?: number;
  askPrice?: number;
  volume?: number;
  openInterest?: number;
  impliedVolatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  strategyType: string;
  positions: Omit<OptionPosition, 'id'>[];
  isPublic: boolean;
  createdBy?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ExcelUploadResult {
  strategies: Strategy[];
  analysisResults: StrategyAnalysis[];
  totalProcessed: number;
  errors?: string[];
}