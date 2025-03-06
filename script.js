
// import * as XLSX from 'xlsx';
// Option position class
class OptionPosition {
    constructor(optionType, action, strike, premium, quantity = 1) {
      this.optionType = optionType.toLowerCase();
      this.action = action.toLowerCase();
      this.strike = strike;
      this.premium = premium;
      this.quantity = quantity;
    }
  
  
    payoff(S_T) {
      let intrinsic;
      if (this.optionType === 'call') {
        intrinsic = Math.max(S_T - this.strike, 0);
      } else if (this.optionType === 'put') {
        intrinsic = Math.max(this.strike - S_T, 0);
      } else {
        throw new Error("option_type must be 'call' or 'put'");
      }
  
      if (this.action === 'buy') {
        return this.quantity * (intrinsic - this.premium);
      } else if (this.action === 'sell') {
        return this.quantity * (this.premium - intrinsic);
      } else {
        throw new Error("action must be 'buy' or 'sell'");
      }
    }
  }
  
  // Option strategy class
  class OptionStrategy {
    constructor(positions) {
      this.positions = positions;
    }
  
    netPayoff(S_T) {
      let total = 0;
      for (const position of this.positions) {
        total += position.payoff(S_T);
      }
      return total;
    }
  
    probabilityOfProfit(S0, T, r, sigma) {
      const S_min = 0.01;
      const S_max = S0 * 2;
      const S_vals = Array.from({ length: 1000 }, (_, i) => S_min + (S_max - S_min) * i / 999);
  
      const payoffs = S_vals.map(S => this.netPayoff(S));
      const positiveMask = payoffs.map(payoff => payoff > 0);
  
      if (!positiveMask.some(val => val)) {
        return 0.0;
      } else if (positiveMask.every(val => val)) {
        return 1.0;
      } else {
        const breakPoints = S_vals.filter((_, i) => i > 0 && positiveMask[i] !== positiveMask[i - 1]);
  
        if (breakPoints.length === 1) {
          const z = (Math.log(breakPoints[0] / S0) - (r - 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
          if (payoffs[0] > 0) {
            return this.cumulativeNormalDistribution(z);
          } else {
            return 1 - this.cumulativeNormalDistribution(z);
          }
        } else if (breakPoints.length === 2) {
          const z1 = (Math.log(breakPoints[0] / S0) - (r - 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
          const z2 = (Math.log(breakPoints[1] / S0) - (r - 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
          return this.cumulativeNormalDistribution(z2) - this.cumulativeNormalDistribution(z1);
        } else {
  
            function payoffPositive(S, strategy) {
                return strategy.netPayoff(S) > 0 ? 1.0 : 0.0;
            }
  
            function pdf_S_T(S, S0, r, sigma, T) {
                return (1 / (S * sigma * Math.sqrt(2 * Math.PI * T))) * Math.exp(-((Math.log(S / S0) - (r - 0.5 * (sigma ** 2)) * T) ** 2) / (2 * (sigma ** 2) * T));
            }
  
            function numericalIntegration(func, a, b, n, strategy, S0, r, sigma, T) {
                const h = (b - a) / n;
                let sum = 0.5 * (func(a, strategy) * pdf_S_T(a, S0, r, sigma, T) + func(b, strategy) * pdf_S_T(b, S0, r, sigma, T));
                for (let i = 1; i < n; i++) {
                    const x = a + i * h;
                    sum += func(x, strategy) * pdf_S_T(x, S0, r, sigma, T);
                }
                return sum * h;
            }
  
            return numericalIntegration(payoffPositive, S_min, S_max, 1000, this, S0, r, sigma, T);
        }
      }
    }
  
    riskRewardRatio(S0, T, r, sigma) {
      const S_min = 0.01;
      const S_max = S0 * 2;
      const S_vals = Array.from({ length: 1000 }, (_, i) => S_min + (S_max - S_min) * i / 999);
      const payoffs = S_vals.map(S => this.netPayoff(S));
  
      const maxProfit = Math.max(...payoffs);
      const maxLoss = Math.min(...payoffs);
  
      if (maxProfit === 0) {
        return maxLoss < 0 ? Infinity : 0;
      }
  
      return Math.abs(maxLoss) / maxProfit;
    }
  
    cumulativeNormalDistribution(x) {
      const a1 = 0.254829592;
      const a2 = -0.284496736;
      const a3 = 1.421413741;
      const a4 = -1.453152027;
      const a5 = 1.061405429;
      const p = 0.3275911;
      const sign = x < 0 ? -1 : 1;
      x = Math.abs(x) / Math.sqrt(2.0);
      const t = 1.0 / (1.0 + p * x);
      const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
      return 0.5 * (1.0 + sign * y);
    }
  }
// Variable to store the 2D matrix internally
let internalMatrix = [];

// Converts the first sheet of an Excel file to a 2D array (matrix)
const convertExcelTo2DMatrix = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                console.log('FileReader onload triggered');
                const data = new Uint8Array(event.target.result);
                console.log('Data read from file:', data);
                const workbook = XLSX.read(data, { type: 'array' });
                console.log('Workbook parsed:', workbook);
                const firstSheetName = workbook.SheetNames[0];
                console.log('First sheet name:', firstSheetName);
                const worksheet = workbook.Sheets[firstSheetName];
                console.log('Worksheet:', worksheet);
                const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                console.log('Matrix generated:', matrix);
                resolve(matrix);
            } catch (err) {
                console.error('Error during file processing:', err);
                reject(err);
            }
        };

        reader.onerror = (err) => {
            console.error('FileReader error:', err);
            reject(err);
        };
        // Read the file as array buffer for Excel parsing
        reader.readAsArrayBuffer(file);
    });
};

// Function to transpose a 2D matrix
const transposeMatrix = (matrix) => {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
};

// Function to convert an array of objects to CSV format
const convertArrayToCSV = (array) => {
    const header = Object.keys(array[0]).join(',');
    const rows = array.map(obj => Object.values(obj).join(','));
    return [header, ...rows].join('\n');
};

// Function to trigger the download of a CSV file
const downloadCSV = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
function createAndDownloadCSV(riskRewardRatios) {
    // Create header row with all possible columns
    const header = [
        'Risk Reward Ratio',
        'Probability of Profit',
        'Call_Sell_Strike',
        'Call_Buy_Strike',
        'Put_Sell_Strike',
        'Put_Buy_Strike',
        'Call_Sell_Price',
        'Call_Buy_Price',
        'Put_Sell_Price',
        'Put_Buy_Price'
    ].join(',');

    // Create rows for each entry
    const rows = riskRewardRatios.map(entry => {
        const indices = Array.from(entry.indices);
        return [
            entry.riskReward.toFixed(4),
            entry.prob.toFixed(4),
            internalMatrix[6][indices[0]],
            internalMatrix[6][indices[1]],
            internalMatrix[6][indices[2]],
            internalMatrix[6][indices[3]],
            internalMatrix[5][indices[0]],
            internalMatrix[5][indices[1]],
            internalMatrix[7][indices[2]],
            internalMatrix[7][indices[3]]
        ].join(',');
    });

    // Combine header and rows
    const csvContent = [header, ...rows].join('\n');

    // Display the CSV content in the output element
    document.getElementById('output').textContent = csvContent;

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `option_strategy_results_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('convertBtn').addEventListener('click', async () => {
        const fileInput = document.getElementById('excelFile');
        const file = fileInput.files?.[0];

        if (!file) {
            alert('Please select an Excel file.');
            return;
        }

        console.log('File selected:', file);

        try {
            const matrix = await convertExcelTo2DMatrix(file);
            internalMatrix = transposeMatrix(matrix); // Store the transposed matrix internally
            console.log('Transposed Matrix:', internalMatrix);
            document.getElementById('output').textContent = JSON.stringify(internalMatrix, null, 2);

            if (internalMatrix && internalMatrix.length > 1) {
                let maxRows = Math.min(30, internalMatrix[0].length); // Limit to 50 rows or the length of the matrix.
                const START = 1; // Start from the second row (index 1)
                const totalIterations = (maxRows - 1) ** 4; // Total combinations
                let completedIterations = 0;
                const riskRewardRatios = [];

                for (let i = START; i < START + maxRows; i++) { // Iterate through Call-ASK
                    console.log(`Processing rows ${i + 1}`);
                    for (let j = START; j + i < START + maxRows; j++) { // Iterate through Call-Bid
                        for (let k = START; k < START + maxRows; k++) { // Iterate through Put-ASK
                            for (let l = START; l + k < START + maxRows; l++) { // Iterate through Put-Bid
                                const callAsk = parseFloat(internalMatrix[5][i]); // Assuming Call-ASK is in column 4
                                const callBid = parseFloat(internalMatrix[5][j + i]); // Assuming Call-Bid is in column 3
                                const putAsk = parseFloat(internalMatrix[7][k]); // Assuming Put-ASK is in column 8
                                const putBid = parseFloat(internalMatrix[7][l + k]); // Assuming Put-Bid is in column 9
            
                                if ( !isNaN(callAsk) && !isNaN(callBid) && !isNaN(putAsk) && !isNaN(putBid)) {
                                    const positions = [
                                        new OptionPosition('call', 'sell', parseFloat(internalMatrix[6][i]), callBid, 1), // Sell Call
                                        new OptionPosition('call', 'buy', parseFloat(internalMatrix[6][j + i]), callAsk, 1), // Buy Call
                                        new OptionPosition('put', 'sell', parseFloat(internalMatrix[6][k]), putBid, 1), // Sell Put
                                        new OptionPosition('put', 'buy', parseFloat(internalMatrix[6][l + k]), putAsk, 1), // Buy Put
                                    ];

                                    const strategy = new OptionStrategy(positions);
            
                                    const S0 = 23559.15;
                                    const T_days = 21;
                                    const T = T_days / 365;
                                    const r = 0.01;
                                    const sigma = 0.122;
            
                                    const prob = strategy.probabilityOfProfit(S0, T, r, sigma);
                                    if (1) {
                                        const riskReward = strategy.riskRewardRatio(S0, T, r, sigma);
                                        const indices = new Uint8Array([i, j + i, k, l + k]);
                                        riskRewardRatios.push({riskReward, prob, indices});
                                    }
                                } else {
                                    console.error(`Invalid data in rows ${i + 1}, ${j + 1}, ${k + 1}, ${l + 1}`);
                                }
                            }
                        }
                    }
                }

                // Sort the risk-reward ratios
                riskRewardRatios.sort((b, a) => a.riskReward - b.riskReward);

                // Display the sorted risk-reward ratios
                console.log('Sorted Risk-Reward Ratios:', riskRewardRatios);
                document.getElementById('output').textContent = JSON.stringify(riskRewardRatios, null, 2);

                // Convert the sorted risk-reward ratios to CSV and trigger download
                createAndDownloadCSV(riskRewardRatios);

            } else {
                console.error("internalMatrix is not defined or is empty.");
            }

        } catch (error) {
            console.error('Error converting file:', error);
            document.getElementById('output').textContent = `An error occurred while converting the Excel file: ${error.message}`;
        }
    });
});
