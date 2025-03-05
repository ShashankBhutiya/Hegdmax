import { OptionPosition, OptionStrategy } from './optionStrategy.js';

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
                let maxRows = Math.min(51, internalMatrix[0].length); // Limit to 50 rows or the length of the matrix.
                maxRows = 10; // Limit to 10 rows for testing
                const totalIterations = (maxRows - 1) ** 4; // Total combinations
                let completedIterations = 0;
                const riskRewardRatios = [];

                for (let i = 1; i < maxRows; i++) { // Iterate through Call-ASK
                    for (let j = 1; j < maxRows; j++) { // Iterate through Call-Bid
                        for (let k = 1; k < maxRows; k++) { // Iterate through Put-ASK
                            console.log(`Processing rows ${i + 1}, ${j + 1}, ${k + 1}`);
                            for (let l = 1; l < maxRows; l++) { // Iterate through Put-Bid
                                // const strike = parseFloat(internalMatrix[6][i]); // Assuming strike price is in column 6
                                const callAsk = parseFloat(internalMatrix[4][i]); // Assuming Call-ASK is in column 4
                                const callBid = parseFloat(internalMatrix[3][j]); // Assuming Call-Bid is in column 3
                                const putAsk = parseFloat(internalMatrix[8][k]); // Assuming Put-ASK is in column 8
                                const putBid = parseFloat(internalMatrix[9][l]); // Assuming Put-Bid is in column 9
            
                                if ( !isNaN(callAsk) && !isNaN(callBid) && !isNaN(putAsk) && !isNaN(putBid)) {
                                    const positions = [
                                        new OptionPosition('call', 'sell', parseFloat(internalMatrix[6][i]), callBid, 1), // Sell Call
                                        new OptionPosition('call', 'buy', parseFloat(internalMatrix[6][j]), callAsk, 1), // Buy Call
                                        new OptionPosition('put', 'sell', parseFloat(internalMatrix[6][k]), putBid, 1), // Sell Put
                                        new OptionPosition('put', 'buy', parseFloat(internalMatrix[6][l]), putAsk, 1), // Buy Put
                                    ];


                                    const callAsk_St = parseFloat(internalMatrix[6][i]);
                                    const callBid_St = parseFloat(internalMatrix[6][i]); 
                                    const putAsk_St = parseFloat(internalMatrix[6][i]);
                                    const putBid_St = parseFloat(internalMatrix[6][i]);
            
                                    const strategy = new OptionStrategy(positions);
            
                                    const S0 = 23559.15;
                                    const T_days = 30;
                                    const T = T_days / 365;
                                    const r = 0.01;
                                    const sigma = 0.122;
            
                                    const prob = strategy.probabilityOfProfit(S0, T, r, sigma);
                                   // console.log(`Strike: ${completedIterations}, Probability of Profit: ${(prob * 100).toFixed(2)}%`);
            
                                    const riskReward = strategy.riskRewardRatio(S0, T, r, sigma);
                                    riskRewardRatios.push({riskReward, prob, callAsk_St, callBid_St, putAsk_St, putBid_St,});
                                    completedIterations++;
                                } else {
                                    console.error(`Invalid data in rows ${i + 1}, ${j + 1}, ${k + 1}, ${l + 1}`);
                                }
                            }
                        }
                    }
                }

                // Sort the risk-reward ratios
                riskRewardRatios.sort((a, b) => a.riskReward - b.riskReward);

                // Display the sorted risk-reward ratios
                console.log('Sorted Risk-Reward Ratios:', riskRewardRatios);
                document.getElementById('output').textContent = JSON.stringify(riskRewardRatios, null, 2);

            } else {
                console.error("internalMatrix is not defined or is empty.");
            }

            function updateProgressBar(completed, total) {
                const progressBar = document.getElementById('progress-bar');
                const progressText = document.getElementById('progress-text');
                const percentage = (completed / total) * 100;

                progressBar.style.width = percentage + '%';
                progressText.textContent = percentage.toFixed(0) + '%';
            }

        } catch (error) {
            console.error('Error converting file:', error);
            document.getElementById('output').textContent = `An error occurred while converting the Excel file: ${error.message}`;
        }
    });
});
