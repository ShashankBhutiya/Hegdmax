import React from 'react';
import { TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react';
import { Card } from '../ui/Card';
import { PayoffChart } from '../charts/PayoffChart';
import type { Strategy, StrategyAnalysis as StrategyAnalysisType } from '../../types';

interface StrategyAnalysisProps {
  strategy: Strategy;
  analysis: StrategyAnalysisType;
}

export const StrategyAnalysis: React.FC<StrategyAnalysisProps> = ({
  strategy,
  analysis
}) => {
  const { riskMetrics, payoffData } = analysis;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{strategy.name}</h2>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            {strategy.underlyingSymbol} @ ${strategy.underlyingPrice.toFixed(2)}
          </span>
        </div>

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-success-50 to-success-100 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-success-600 mr-3" />
              <div>
                <p className="text-xs font-medium text-success-600 uppercase tracking-wide">
                  Probability of Profit
                </p>
                <p className="text-2xl font-bold text-success-700">
                  {formatPercentage(riskMetrics.probabilityOfProfit)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-lg">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">
                  Risk/Reward Ratio
                </p>
                <p className="text-2xl font-bold text-primary-700">
                  {riskMetrics.riskRewardRatio.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-success-50 to-success-100 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-success-600 mr-3" />
              <div>
                <p className="text-xs font-medium text-success-600 uppercase tracking-wide">
                  Max Profit
                </p>
                <p className="text-2xl font-bold text-success-700">
                  {formatCurrency(riskMetrics.maxProfit)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-error-50 to-error-100 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-error-600 mr-3" />
              <div>
                <p className="text-xs font-medium text-error-600 uppercase tracking-wide">
                  Max Loss
                </p>
                <p className="text-2xl font-bold text-error-700">
                  {formatCurrency(riskMetrics.maxLoss)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Break-even Points */}
        {riskMetrics.breakEvenPoints.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Break-even Points
            </h3>
            <div className="flex flex-wrap gap-2">
              {riskMetrics.breakEvenPoints.map((point, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                >
                  ${point.toFixed(2)}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Payoff Chart */}
      <Card>
        <PayoffChart
          data={payoffData}
          breakEvenPoints={riskMetrics.breakEvenPoints}
          currentPrice={strategy.underlyingPrice}
          title={`${strategy.name} - Payoff Diagram`}
        />
      </Card>

      {/* Position Details */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Position Details
        </h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Action</th>
                <th>Strike</th>
                <th>Premium</th>
                <th>Quantity</th>
                <th>Max Risk</th>
                <th>Max Reward</th>
              </tr>
            </thead>
            <tbody>
              {strategy.positions.map((position, index) => (
                <tr key={position.id || index}>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      position.optionType === 'call' 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-primary-100 text-primary-800'
                    }`}>
                      {position.optionType.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      position.action === 'buy' 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-error-100 text-error-800'
                    }`}>
                      {position.action.toUpperCase()}
                    </span>
                  </td>
                  <td>${position.strike.toFixed(2)}</td>
                  <td>${position.premium.toFixed(2)}</td>
                  <td>{position.quantity}</td>
                  <td>
                    {position.action === 'buy' 
                      ? formatCurrency(position.premium * position.quantity)
                      : 'Unlimited'
                    }
                  </td>
                  <td>
                    {position.action === 'sell' 
                      ? formatCurrency(position.premium * position.quantity)
                      : 'Unlimited'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};