// Option position class
export class OptionPosition {
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
export class OptionStrategy {
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

    return Math.abs(maxProfit/maxLoss);
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

//   generatePayoffChart(S0, T, r, sigma) {
//     const S_min = 0.01;
//     const S_max = S0 * 2;
//     const S_vals = Array.from({ length: 1000 }, (_, i) => S_min + (S_max - S_min) * i / 999);
//     const payoffs = S_vals.map(S => this.netPayoff(S));

//     const canvas = document.getElementById('payoffChart');
//     if (!canvas) {
//       console.error('Canvas element with id "payoffChart" not found.');
//       return;
//     }

//     const ctx = canvas.getContext('2d');
//     if (window.payoffChart && typeof window.payoffChart.destroy === 'function') {
//       window.payoffChart.destroy();
//     }

//     // Clear the canvas
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     window.payoffChart = new Chart(ctx, {
//       type: 'line',
//       data: {
//         labels: S_vals,
//         datasets: [{
//           label: 'Payoff',
//           data: payoffs,
//           borderColor: 'rgba(75, 192, 192, 1)',
//           borderWidth: 2,
//           fill: false
//         }]
//       },
//       options: {
//         responsive: true,
//         scales: {
//           x: {
//             type: 'linear',
//             position: 'bottom',
//             title: {
//               display: true,
//               text: 'Underlying Price (S)'
//             }
//           },
//           y: {
//             title: {
//               display: true,
//               text: 'Payoff'
//             }
//           }
//         }
//       }
//     });
//   }
}