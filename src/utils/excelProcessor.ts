import * as XLSX from 'xlsx';
import { OptionPosition, OptionStrategy } from './optionCalculations';
import type { Strategy, StrategyAnalysis, ExcelUploadResult } from '../types';

export class ExcelProcessor {
  static async processFile(file: File): Promise<ExcelUploadResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          const result = await this.analyzeMatrix(matrix);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  private static async analyzeMatrix(matrix: any[][]): Promise<ExcelUploadResult> {
    const transposedMatrix = this.transposeMatrix(matrix);
    const strategies: Strategy[] = [];
    const analysisResults: StrategyAnalysis[] = [];
    const errors: string[] = [];

    // Market parameters
    const S0 = 23559.15; // Current underlying price
    const T = 21 / 365; // Time to expiration
    const r = 0.01; // Risk-free rate
    const sigma = 0.122; // Implied volatility

    const maxRows = Math.min(30, transposedMatrix[0]?.length || 0);
    const START = 1;
    let strategyCount = 0;

    for (let i = START; i < START + maxRows; i++) {
      for (let j = START; j + i < START + maxRows; j++) {
        for (let k = START; k < START + maxRows; k++) {
          for (let l = START; l + k < START + maxRows; l++) {
            try {
              const callAsk = parseFloat(transposedMatrix[5]?.[i]);
              const callBid = parseFloat(transposedMatrix[5]?.[j + i]);
              const putAsk = parseFloat(transposedMatrix[7]?.[k]);
              const putBid = parseFloat(transposedMatrix[7]?.[l + k]);

              if (!isNaN(callAsk) && !isNaN(callBid) && !isNaN(putAsk) && !isNaN(putBid)) {
                const positions = [
                  new OptionPosition('call', 'sell', parseFloat(transposedMatrix[6]?.[i]), callBid, 1),
                  new OptionPosition('call', 'buy', parseFloat(transposedMatrix[6]?.[j + i]), callAsk, 1),
                  new OptionPosition('put', 'sell', parseFloat(transposedMatrix[6]?.[k]), putBid, 1),
                  new OptionPosition('put', 'buy', parseFloat(transposedMatrix[6]?.[l + k]), putAsk, 1),
                ];

                const strategy: Strategy = {
                  id: `strategy-${strategyCount++}`,
                  userId: 'temp-user',
                  name: `Iron Condor ${i}-${j + i}-${k}-${l + k}`,
                  underlyingSymbol: 'INDEX',
                  underlyingPrice: S0,
                  positions: positions.map(p => ({
                    id: `pos-${Math.random()}`,
                    optionType: p.optionType,
                    action: p.action,
                    strike: p.strike,
                    premium: p.premium,
                    quantity: p.quantity,
                  })),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };

                const optionStrategy = new OptionStrategy(positions);
                const probabilityOfProfit = optionStrategy.probabilityOfProfit(S0, T, r, sigma);
                const riskRewardRatio = optionStrategy.riskRewardRatio(S0, T, r, sigma);

                // Generate payoff data
                const priceRange = Array.from({ length: 100 }, (_, idx) => S0 * (0.5 + idx * 0.01));
                const payoffs = priceRange.map(price => optionStrategy.netPayoff(price));

                const analysis: StrategyAnalysis = {
                  strategyId: strategy.id,
                  riskMetrics: {
                    probabilityOfProfit,
                    riskRewardRatio,
                    maxProfit: Math.max(...payoffs),
                    maxLoss: Math.min(...payoffs),
                    breakEvenPoints: this.findBreakEvenPoints(priceRange, payoffs),
                  },
                  payoffData: {
                    underlyingPrices: priceRange,
                    payoffs,
                  },
                  greeks: {
                    delta: 0,
                    gamma: 0,
                    theta: 0,
                    vega: 0,
                  },
                };

                strategy.riskMetrics = analysis.riskMetrics;
                strategies.push(strategy);
                analysisResults.push(analysis);
              }
            } catch (error) {
              errors.push(`Error processing combination ${i}-${j}-${k}-${l}: ${error}`);
            }
          }
        }
      }
    }

    // Sort by risk-reward ratio
    const sortedIndices = analysisResults
      .map((analysis, index) => ({ analysis, index }))
      .sort((a, b) => b.analysis.riskMetrics.riskRewardRatio - a.analysis.riskMetrics.riskRewardRatio)
      .map(item => item.index);

    const sortedStrategies = sortedIndices.map(i => strategies[i]);
    const sortedAnalysis = sortedIndices.map(i => analysisResults[i]);

    return {
      strategies: sortedStrategies.slice(0, 100), // Limit to top 100
      analysisResults: sortedAnalysis.slice(0, 100),
      totalProcessed: strategies.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private static transposeMatrix(matrix: any[][]): any[][] {
    if (!matrix || matrix.length === 0) return [];
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  private static findBreakEvenPoints(prices: number[], payoffs: number[]): number[] {
    const breakEvenPoints: number[] = [];
    
    for (let i = 1; i < payoffs.length; i++) {
      if ((payoffs[i-1] <= 0 && payoffs[i] > 0) || (payoffs[i-1] > 0 && payoffs[i] <= 0)) {
        const breakEven = prices[i-1] + (prices[i] - prices[i-1]) * 
          Math.abs(payoffs[i-1]) / (Math.abs(payoffs[i-1]) + Math.abs(payoffs[i]));
        breakEvenPoints.push(breakEven);
      }
    }
    
    return breakEvenPoints;
  }

  static exportToCSV(strategies: Strategy[], analysisResults: StrategyAnalysis[]): string {
    const header = [
      'Strategy Name',
      'Risk Reward Ratio',
      'Probability of Profit',
      'Max Profit',
      'Max Loss',
      'Break Even Points',
      'Call Sell Strike',
      'Call Buy Strike',
      'Put Sell Strike',
      'Put Buy Strike',
      'Call Sell Premium',
      'Call Buy Premium',
      'Put Sell Premium',
      'Put Buy Premium'
    ].join(',');

    const rows = strategies.map((strategy, index) => {
      const analysis = analysisResults[index];
      const positions = strategy.positions;
      
      return [
        strategy.name,
        analysis.riskMetrics.riskRewardRatio.toFixed(4),
        analysis.riskMetrics.probabilityOfProfit.toFixed(4),
        analysis.riskMetrics.maxProfit.toFixed(2),
        analysis.riskMetrics.maxLoss.toFixed(2),
        analysis.riskMetrics.breakEvenPoints.map(p => p.toFixed(2)).join(';'),
        positions[0]?.strike || '',
        positions[1]?.strike || '',
        positions[2]?.strike || '',
        positions[3]?.strike || '',
        positions[0]?.premium || '',
        positions[1]?.premium || '',
        positions[2]?.premium || '',
        positions[3]?.premium || '',
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }
}