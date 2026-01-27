// AI-Analytics Monte Carlo Simulation Service

import type { Simulation, SimulationResult } from '../types';

export interface Distribution {
  type: 'NORMAL' | 'LOGNORMAL' | 'UNIFORM' | 'EXPONENTIAL' | 'TRIANGULAR' | 'BETA' | 'GAMMA';
  params: Record<string, number>;
}

export interface SimulationInput {
  name: string;
  distribution: Distribution;
}

export interface MonteCarloConfig {
  iterations: number;
  seed?: number;
  confidenceLevel: number;
  outputVariables: string[];
  formula: (inputs: Record<string, number>) => Record<string, number>;
}

export class SimulationService {
  private rng: () => number;

  constructor(seed?: number) {
    this.rng = seed ? this.seededRandom(seed) : Math.random;
  }

  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) % 2147483648;
      return state / 2147483648;
    };
  }

  async runMonteCarlo(
    inputs: SimulationInput[],
    config: MonteCarloConfig
  ): Promise<Map<string, SimulationResult>> {
    const results: Map<string, number[]> = new Map();
    config.outputVariables.forEach(v => results.set(v, []));

    for (let i = 0; i < config.iterations; i++) {
      // Sample from input distributions
      const sampledInputs: Record<string, number> = {};
      for (const input of inputs) {
        sampledInputs[input.name] = this.sampleFromDistribution(input.distribution);
      }

      // Calculate outputs
      const outputs = config.formula(sampledInputs);
      for (const [key, value] of Object.entries(outputs)) {
        results.get(key)?.push(value);
      }
    }

    // Calculate statistics for each output
    const simulationResults: Map<string, SimulationResult> = new Map();

    for (const [variable, values] of results.entries()) {
      simulationResults.set(variable, this.calculateStatistics(variable, values, config.confidenceLevel));
    }

    return simulationResults;
  }

  private sampleFromDistribution(dist: Distribution): number {
    switch (dist.type) {
      case 'NORMAL':
        return this.sampleNormal(dist.params['mean'] ?? 0, dist.params['std'] ?? 1);
      case 'LOGNORMAL':
        return Math.exp(this.sampleNormal(dist.params['mu'] ?? 0, dist.params['sigma'] ?? 1));
      case 'UNIFORM':
        return (dist.params['min'] ?? 0) + this.rng() * ((dist.params['max'] ?? 1) - (dist.params['min'] ?? 0));
      case 'EXPONENTIAL':
        return -Math.log(1 - this.rng()) / (dist.params['lambda'] ?? 1);
      case 'TRIANGULAR':
        return this.sampleTriangular(
          dist.params['min'] ?? 0,
          dist.params['mode'] ?? 0.5,
          dist.params['max'] ?? 1
        );
      case 'BETA':
        return this.sampleBeta(dist.params['alpha'] ?? 1, dist.params['beta'] ?? 1);
      case 'GAMMA':
        return this.sampleGamma(dist.params['shape'] ?? 1, dist.params['scale'] ?? 1);
      default:
        return this.rng();
    }
  }

  private sampleNormal(mean: number, std: number): number {
    // Box-Muller transform
    const u1 = this.rng();
    const u2 = this.rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
  }

  private sampleTriangular(min: number, mode: number, max: number): number {
    const u = this.rng();
    const fc = (mode - min) / (max - min);

    if (u < fc) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }

  private sampleBeta(alpha: number, beta: number): number {
    const gamma1 = this.sampleGamma(alpha, 1);
    const gamma2 = this.sampleGamma(beta, 1);
    return gamma1 / (gamma1 + gamma2);
  }

  private sampleGamma(shape: number, scale: number): number {
    // Marsaglia and Tsang's method
    if (shape < 1) {
      return this.sampleGamma(1 + shape, scale) * Math.pow(this.rng(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;

      do {
        x = this.sampleNormal(0, 1);
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = this.rng();

      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  private calculateStatistics(
    variable: string,
    values: number[],
    confidenceLevel: number
  ): SimulationResult {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;

    const mean = values.reduce((s, v) => s + v, 0) / n;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    const percentileIndex = (p: number) => Math.floor(p / 100 * (n - 1));

    return {
      id: `sim_result_${Date.now()}`,
      simulationId: '',
      outputVariable: variable,
      mean,
      std,
      median: sorted[percentileIndex(50)] ?? 0,
      min: sorted[0] ?? 0,
      max: sorted[n - 1] ?? 0,
      var95: sorted[percentileIndex(95)] ?? 0,
      var99: sorted[percentileIndex(99)] ?? 0,
      cvar95: this.calculateCVaR(sorted, 0.95),
    };
  }

  private calculateCVaR(sorted: number[], confidenceLevel: number): number {
    const threshold = sorted[Math.floor(confidenceLevel * sorted.length)] ?? 0;
    const tailValues = sorted.filter(v => v >= threshold);
    return tailValues.length > 0
      ? tailValues.reduce((s, v) => s + v, 0) / tailValues.length
      : threshold;
  }

  // Insurance-specific simulations
  async simulateLossRatio(
    expectedClaims: number,
    claimSeverityDist: Distribution,
    premiumVolume: number,
    iterations: number = 10000
  ): Promise<SimulationResult> {
    const lossRatios: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Simulate number of claims (Poisson)
      const numClaims = this.samplePoisson(expectedClaims);

      // Simulate total claims amount
      let totalClaims = 0;
      for (let j = 0; j < numClaims; j++) {
        totalClaims += this.sampleFromDistribution(claimSeverityDist);
      }

      lossRatios.push(totalClaims / premiumVolume);
    }

    return this.calculateStatistics('loss_ratio', lossRatios, 0.95);
  }

  private samplePoisson(lambda: number): number {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;

    do {
      k++;
      p *= this.rng();
    } while (p > L);

    return k - 1;
  }

  async runStressTest(
    baseScenario: Record<string, number>,
    shocks: Array<{ name: string; factor: number }>,
    impactFormula: (scenario: Record<string, number>) => number
  ): Promise<Array<{ scenario: string; impact: number }>> {
    const results: Array<{ scenario: string; impact: number }> = [];

    // Base scenario
    results.push({
      scenario: 'BASE',
      impact: impactFormula(baseScenario),
    });

    // Individual shocks
    for (const shock of shocks) {
      const stressedScenario = { ...baseScenario };
      const currentValue = stressedScenario[shock.name];
      if (currentValue !== undefined) {
        stressedScenario[shock.name] = currentValue * shock.factor;
      }
      results.push({
        scenario: `STRESS_${shock.name.toUpperCase()}`,
        impact: impactFormula(stressedScenario),
      });
    }

    // Combined stress
    const combinedScenario = { ...baseScenario };
    for (const shock of shocks) {
      const currentValue = combinedScenario[shock.name];
      if (currentValue !== undefined) {
        combinedScenario[shock.name] = currentValue * shock.factor;
      }
    }
    results.push({
      scenario: 'COMBINED_STRESS',
      impact: impactFormula(combinedScenario),
    });

    return results;
  }
}

export const simulationService = new SimulationService();
