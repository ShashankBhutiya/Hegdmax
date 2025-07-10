import React from 'react';
import { format } from 'date-fns';
import { Eye, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { Strategy } from '../../types';

interface StrategyListProps {
  strategies: Strategy[];
  onView: (strategy: Strategy) => void;
  onEdit: (strategy: Strategy) => void;
  onDelete: (strategyId: string) => void;
  isLoading?: boolean;
}

export const StrategyList: React.FC<StrategyListProps> = ({
  strategies,
  onView,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <Card className="text-center py-12">
        <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No strategies found
        </h3>
        <p className="text-gray-500 mb-6">
          Create your first options strategy to get started with analysis.
        </p>
        <Button variant="primary">
          Create Strategy
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {strategies.map((strategy) => (
        <Card key={strategy.id} className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {strategy.name}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {strategy.underlyingSymbol}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Underlying Price</p>
                  <p className="text-sm font-medium">${strategy.underlyingPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Positions</p>
                  <p className="text-sm font-medium">{strategy.positions.length}</p>
                </div>
                {strategy.riskMetrics && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500">Probability of Profit</p>
                      <div className="flex items-center">
                        <p className="text-sm font-medium">
                          {(strategy.riskMetrics.probabilityOfProfit * 100).toFixed(1)}%
                        </p>
                        {strategy.riskMetrics.probabilityOfProfit > 0.5 ? (
                          <TrendingUp className="w-3 h-3 text-success-600 ml-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-error-600 ml-1" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Risk/Reward</p>
                      <p className="text-sm font-medium">
                        {strategy.riskMetrics.riskRewardRatio.toFixed(2)}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                Created {format(new Date(strategy.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(strategy)}
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(strategy)}
                title="Edit Strategy"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(strategy.id)}
                className="text-error-600 hover:text-error-700 hover:bg-error-50"
                title="Delete Strategy"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};