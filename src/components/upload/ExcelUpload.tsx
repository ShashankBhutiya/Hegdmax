import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ExcelProcessor } from '../../utils/excelProcessor';
import type { ExcelUploadResult } from '../../types';

interface ExcelUploadProps {
  onUploadComplete: (result: ExcelUploadResult) => void;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await ExcelProcessor.processFile(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        onUploadComplete(result);
        setIsProcessing(false);
        setProgress(0);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to process Excel file');
      setIsProcessing(false);
      setProgress(0);
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const downloadSampleFile = () => {
    // Create a sample CSV for demonstration
    const sampleData = [
      ['Symbol', 'Expiration', 'Strike', 'Type', 'Bid', 'Ask', 'Volume'],
      ['SPX', '2024-01-19', '4800', 'Call', '12.50', '13.00', '150'],
      ['SPX', '2024-01-19', '4850', 'Call', '8.25', '8.75', '200'],
      ['SPX', '2024-01-19', '4800', 'Put', '15.00', '15.50', '100'],
      ['SPX', '2024-01-19', '4850', 'Put', '20.25', '20.75', '175'],
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_options_data.csv';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Options Data
        </h2>
        <p className="text-gray-600">
          Upload your Excel file containing options chain data to analyze strategies
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
        >
          <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          
          <div className="space-y-4">
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your Excel file here
              </p>
              <p className="text-sm text-gray-500">
                or click to browse files
              </p>
            </div>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isProcessing}
            />
            
            <label htmlFor="file-upload">
              <Button
                variant="primary"
                size="lg"
                disabled={isProcessing}
                className="cursor-pointer"
                as="span"
              >
                <Upload className="w-5 h-5 mr-2" />
                Select Excel File
              </Button>
            </label>

            <p className="text-xs text-gray-500">
              Supports .xlsx and .xls files up to 10MB
            </p>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Processing file...
              </span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-error-50 border border-error-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-error-600 mr-2" />
              <span className="text-error-700">{error}</span>
            </div>
          </div>
        )}
      </Card>

      <div className="text-center">
        <Button
          variant="secondary"
          onClick={downloadSampleFile}
          className="inline-flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Sample File
        </Button>
      </div>
    </div>
  );
};