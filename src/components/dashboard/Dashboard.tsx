import React, { useEffect } from 'react';
import { TrendingUp, BarChart3, Target, DollarSign } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useStrategyStore } from '../../stores/strategyStore';
import { useAuthStore } from '../../stores/authStore';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { strategies, fetchStrategies, isLoading } = useStrategyStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchStrategies();
    }
  }, [user, fetchStrategies]);

  const totalStrategies = strategies.length;
  const profitableStrategies = strategies.filter(
    s => s.riskMetrics && s.riskMetrics.probabilityOfProfit > 0.5
  ).length;
  const avgProbability = strategies.length > 0 
    ? strategies.reduce((sum, s) => sum + (s.riskMetrics?.probabilityOfProfit || 0), 0) / strategies.length
    : 0;
  const totalMaxProfit = strategies.reduce((sum, s) => sum + (s.riskMetrics?.maxProfit || 0), 0);

  const recentStrategies = strategies.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Options Analyzer Pro
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Analyze, optimize, and manage your options trading strategies with professional-grade tools
        </p>
        
        {totalStrategies === 0 && (
          <div className="flex justify-center space-x-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('upload')}
            >
              Upload Excel Data
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('create')}
            >
              Create Strategy
            </Button>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">
                Total Strategies
              </p>
              <p className="text-2xl font-bold text-primary-700">
                {totalStrategies}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-success-50 to-success-100">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-success-600 mr-3" />
            <div>
              <p className="text-xs font-medium text-success-600 uppercase tracking-wide">
                Profitable Strategies
              </p>
              <p className="text-2xl font-bold text-success-700">
                {profitableStrategies}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                Avg. Probability
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {(avgProbability * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                Total Max Profit
              </p>
              <p className="text-2xl font-bold text-green-700">
                ${totalMaxProfit.toFixed(0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Strategies */}
      {recentStrategies.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Strategies</h2>
            <Button
              variant="ghost"
              onClick={() => onNavigate('strategies')}
            >
              View All
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Symbol</th>
                  <th>Probability</th>
                  <th>Risk/Reward</th>
                  <th>Max Profit</th>
                  <th>Max Loss</th>
                </tr>
              </thead>
              <tbody>
                {recentStrategies.map((strategy) => (
                  <tr key={strategy.id}>
                    <td className="font-medium">{strategy.name}</td>
                    <td>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {strategy.underlyingSymbol}
                      </span>
                    </td>
                    <td>
                      {strategy.riskMetrics ? (
                        <span className={`font-medium ${
                          strategy.riskMetrics.probabilityOfProfit > 0.5 
                            ? 'text-success-600' 
                            : 'text-error-600'
                        }`}>
                          {(strategy.riskMetrics.probabilityOfProfit * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      {strategy.riskMetrics ? (
                        <span className="font-medium">
                          {strategy.riskMetrics.riskRewardRatio.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      {strategy.riskMetrics ? (
                        <span className="text-success-600 font-medium">
                          ${strategy.riskMetrics.maxProfit.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      {strategy.riskMetrics ? (
                        <span className="text-error-600 font-medium">
                          ${strategy.riskMetrics.maxLoss.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate('upload')}
            className="h-20 flex-col"
          >
            <BarChart3 className="w-6 h-6 mb-2" />
            Upload Excel Data
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => onNavigate('create')}
            className="h-20 flex-col"
          >
            <TrendingUp className="w-6 h-6 mb-2" />
            Create Strategy
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => onNavigate('templates')}
            className="h-20 flex-col"
          >
            <Target className="w-6 h-6 mb-2" />
            Browse Templates
          </Button>
        </div>
      </Card>
    </div>
  );
};