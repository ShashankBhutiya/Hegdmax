import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AuthForm } from './components/auth/AuthForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { ExcelUpload } from './components/upload/ExcelUpload';
import { StrategyList } from './components/strategies/StrategyList';
import { StrategyAnalysis } from './components/strategies/StrategyAnalysis';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { useAuthStore } from './stores/authStore';
import { useStrategyStore } from './stores/strategyStore';
import type { ExcelUploadResult, Strategy } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [uploadResult, setUploadResult] = useState<ExcelUploadResult | null>(null);
  const [showUploadResults, setShowUploadResults] = useState(false);

  const { isAuthenticated, initialize, isLoading: authLoading } = useAuthStore();
  const { 
    strategies, 
    currentAnalysis, 
    fetchStrategies, 
    deleteStrategy, 
    analyzeStrategy,
    isLoading: strategyLoading 
  } = useStrategyStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStrategies();
    }
  }, [isAuthenticated, fetchStrategies]);

  const handleUploadComplete = (result: ExcelUploadResult) => {
    setUploadResult(result);
    setShowUploadResults(true);
  };

  const handleViewStrategy = async (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    try {
      await analyzeStrategy(strategy);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Failed to analyze strategy:', error);
    }
  };

  const handleEditStrategy = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setActiveTab('create');
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      await deleteStrategy(strategyId);
    }
  };

  const downloadUploadResults = () => {
    if (!uploadResult) return;

    const { ExcelProcessor } = require('./utils/excelProcessor');
    const csvContent = ExcelProcessor.exportToCSV(
      uploadResult.strategies,
      uploadResult.analysisResults
    );

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `options_analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      
      case 'upload':
        return <ExcelUpload onUploadComplete={handleUploadComplete} />;
      
      case 'strategies':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">My Strategies</h1>
              <Button
                variant="primary"
                onClick={() => setActiveTab('create')}
              >
                Create New Strategy
              </Button>
            </div>
            <StrategyList
              strategies={strategies}
              onView={handleViewStrategy}
              onEdit={handleEditStrategy}
              onDelete={handleDeleteStrategy}
              isLoading={strategyLoading}
            />
          </div>
        );
      
      case 'create':
        return (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedStrategy ? 'Edit Strategy' : 'Create New Strategy'}
            </h1>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-gray-600">
                Strategy creation form will be implemented here. This would include:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
                <li>Strategy name and description</li>
                <li>Underlying symbol and current price</li>
                <li>Option positions (calls/puts, buy/sell, strikes, premiums)</li>
                <li>Market parameters (volatility, risk-free rate, time to expiration)</li>
                <li>Real-time analysis and payoff visualization</li>
              </ul>
            </div>
          </div>
        );
      
      case 'templates':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Strategy Templates</h1>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-gray-600">
                Pre-built strategy templates will be available here, including:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
                <li>Iron Condor</li>
                <li>Butterfly Spread</li>
                <li>Straddle/Strangle</li>
                <li>Covered Call</li>
                <li>Protective Put</li>
                <li>And many more...</li>
              </ul>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-gray-600">
                User settings and preferences will be available here, including:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
                <li>Profile information</li>
                <li>Risk tolerance settings</li>
                <li>Default portfolio size</li>
                <li>Notification preferences</li>
                <li>API integrations</li>
              </ul>
            </div>
          </div>
        );
      
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Strategy Analysis Modal */}
      <Modal
        isOpen={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        title="Strategy Analysis"
        size="xl"
      >
        {selectedStrategy && currentAnalysis && (
          <StrategyAnalysis
            strategy={selectedStrategy}
            analysis={currentAnalysis}
          />
        )}
      </Modal>

      {/* Upload Results Modal */}
      <Modal
        isOpen={showUploadResults}
        onClose={() => setShowUploadResults(false)}
        title="Upload Results"
        size="lg"
      >
        {uploadResult && (
          <div className="space-y-4">
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-success-800 mb-2">
                Upload Successful!
              </h3>
              <p className="text-success-700">
                Processed {uploadResult.totalProcessed} strategies from your Excel file.
                Found {uploadResult.strategies.length} viable option combinations.
              </p>
            </div>

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">
                  Processing Warnings:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {uploadResult.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {uploadResult.errors.length > 5 && (
                    <li>• ... and {uploadResult.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="primary"
                onClick={downloadUploadResults}
              >
                Download Results (CSV)
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUploadResults(false);
                  setActiveTab('strategies');
                }}
              >
                View Strategies
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;