import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PayoffChartProps {
  data: {
    underlyingPrices: number[];
    payoffs: number[];
  };
  breakEvenPoints?: number[];
  currentPrice?: number;
  title?: string;
}

export const PayoffChart: React.FC<PayoffChartProps> = ({
  data,
  breakEvenPoints = [],
  currentPrice,
  title = 'Strategy Payoff Diagram'
}) => {
  const chartData = useMemo(() => {
    const datasets = [
      {
        label: 'Strategy Payoff',
        data: data.payoffs,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      // Zero line
      {
        label: 'Break Even',
        data: data.underlyingPrices.map(() => 0),
        borderColor: 'rgb(156, 163, 175)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
      }
    ];

    // Add current price line if provided
    if (currentPrice) {
      const currentPricePayoff = data.payoffs[
        data.underlyingPrices.findIndex(price => price >= currentPrice) || 0
      ];
      
      datasets.push({
        label: 'Current Price',
        data: data.underlyingPrices.map(() => currentPricePayoff),
        borderColor: 'rgb(34, 197, 94)',
        borderDash: [10, 5],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
      });
    }

    return {
      labels: data.underlyingPrices.map(price => price.toFixed(0)),
      datasets,
    };
  }, [data, currentPrice]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Underlying Price ($)',
          font: {
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Profit/Loss ($)',
          font: {
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          callback: (value) => `$${value}`,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className="w-full h-96">
      <Line data={chartData} options={options} />
    </div>
  );
};