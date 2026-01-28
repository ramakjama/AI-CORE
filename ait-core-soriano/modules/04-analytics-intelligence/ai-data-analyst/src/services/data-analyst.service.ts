import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalysisReport, AnalysisType, AnalysisStatus } from '../entities/analysis-report.entity';
import { DataSet } from '../entities/dataset.entity';
import { MLModel } from '../entities/ml-model.entity';
import { MLModelService } from './ml-model.service';
import { StatisticalAnalysisService } from './statistical-analysis.service';
import { DataProcessingService } from './data-processing.service';
import { TimeSeriesAnalysisService } from './time-series-analysis.service';
import { DataVisualizationService } from './data-visualization.service';

@Injectable()
export class DataAnalystService {
  private readonly logger = new Logger(DataAnalystService.name);

  constructor(
    @InjectRepository(AnalysisReport)
    private analysisReportRepository: Repository<AnalysisReport>,
    @InjectRepository(DataSet)
    private dataSetRepository: Repository<DataSet>,
    @InjectRepository(MLModel)
    private mlModelRepository: Repository<MLModel>,
    private mlModelService: MLModelService,
    private statisticalService: StatisticalAnalysisService,
    private dataProcessingService: DataProcessingService,
    private timeSeriesService: TimeSeriesAnalysisService,
    private visualizationService: DataVisualizationService,
  ) {}

  async performAnalysis(
    datasetId: string,
    type: AnalysisType,
    parameters: Record<string, any>,
  ): Promise<AnalysisReport> {
    const startTime = Date.now();

    const report = this.analysisReportRepository.create({
      name: `Analysis ${type} - ${new Date().toISOString()}`,
      type,
      status: AnalysisStatus.PROCESSING,
      datasetId,
      parameters,
    });

    await this.analysisReportRepository.save(report);

    try {
      // Fetch dataset
      const dataset = await this.dataSetRepository.findOne({
        where: { id: datasetId },
      });

      if (!dataset) {
        throw new Error(`Dataset ${datasetId} not found`);
      }

      let results: any;

      switch (type) {
        case AnalysisType.DESCRIPTIVE:
          results = await this.performDescriptiveAnalysis(parameters);
          break;
        case AnalysisType.DIAGNOSTIC:
          results = await this.performDiagnosticAnalysis(parameters);
          break;
        case AnalysisType.PREDICTIVE:
          results = await this.performPredictiveAnalysis(parameters);
          break;
        case AnalysisType.PRESCRIPTIVE:
          results = await this.performPrescriptiveAnalysis(parameters);
          break;
        case AnalysisType.EXPLORATORY:
          results = await this.performExploratoryAnalysis(parameters);
          break;
      }

      const executionTime = Date.now() - startTime;

      report.status = AnalysisStatus.COMPLETED;
      report.results = results;
      report.completedAt = new Date();
      report.metadata = {
        ...report.metadata,
        executionTime,
        datasetId,
      };

      await this.analysisReportRepository.save(report);

      return report;
    } catch (error) {
      this.logger.error(`Analysis failed: ${error.message}`);
      report.status = AnalysisStatus.FAILED;
      report.errorMessage = error.message;
      await this.analysisReportRepository.save(report);
      throw error;
    }
  }

  private async performDescriptiveAnalysis(params: any): Promise<any> {
    const { data } = params;

    const statistics = this.statisticalService.calculateDescriptiveStats(data);
    const quality = this.dataProcessingService.assessDataQuality(data);
    const outliers = this.statisticalService.detectOutliers(data);

    const insights = this.generateDescriptiveInsights(statistics, quality);
    const visualizations = [
      this.visualizationService.generateHistogram(data, 20, {
        title: 'Data Distribution',
      }),
      this.visualizationService.generateBoxPlot(
        [
          {
            label: 'Dataset',
            min: statistics.min,
            q1: statistics.quartiles.q1,
            median: statistics.median,
            q3: statistics.quartiles.q3,
            max: statistics.max,
          },
        ],
        { title: 'Box Plot' },
      ),
    ];

    return {
      summary: {
        recordCount: statistics.count,
        mean: statistics.mean,
        median: statistics.median,
        mode: statistics.mode,
        dataQuality: quality.qualityScore,
      },
      statistics,
      quality,
      outliers,
      insights,
      visualizations,
    };
  }

  private async performDiagnosticAnalysis(params: any): Promise<any> {
    const { data, targetVariable } = params;

    // Perform correlation analysis
    const correlations = this.statisticalService.calculateCorrelationMatrix(data);

    // Detect patterns and relationships
    const insights = this.generateDiagnosticInsights(correlations);

    const visualizations = [
      this.visualizationService.generateCorrelationMatrix(
        correlations.matrix,
        correlations.variables,
      ),
    ];

    return {
      summary: {
        variableCount: correlations.variables.length,
        significantRelationships: correlations.significantPairs.length,
      },
      correlations,
      insights,
      recommendations: this.generateDiagnosticRecommendations(correlations),
      visualizations,
    };
  }

  private async performPredictiveAnalysis(params: any): Promise<any> {
    const { features, labels, modelType, hyperparameters } = params;

    const modelId = `model_${Date.now()}`;

    let trainingResult: any;

    if (modelType === 'neural_network') {
      trainingResult = await this.mlModelService.trainNeuralNetwork(
        { features, labels },
        hyperparameters,
        modelId,
      );
    } else if (modelType === 'linear_regression') {
      trainingResult = await this.mlModelService.trainLinearRegression(
        { x: features.map((f) => f[0]), y: labels.map((l) => l[0]) },
        modelId,
      );
    }

    const insights = this.generatePredictiveInsights(trainingResult);

    return {
      summary: {
        modelType,
        performance: trainingResult.performance,
      },
      trainingResult,
      insights,
      recommendations: this.generatePredictiveRecommendations(trainingResult),
    };
  }

  private async performPrescriptiveAnalysis(params: any): Promise<any> {
    const { scenarios, constraints, objectives } = params;

    // Simplified optimization
    const optimalScenario = this.findOptimalScenario(
      scenarios,
      constraints,
      objectives,
    );

    const insights = [
      `Optimal scenario identified with score: ${optimalScenario.score}`,
      `Expected outcome: ${optimalScenario.outcome}`,
    ];

    return {
      summary: {
        scenariosEvaluated: scenarios.length,
        optimalScenario: optimalScenario.name,
      },
      optimalScenario,
      alternatives: scenarios.slice(0, 5),
      insights,
      recommendations: this.generatePrescriptiveRecommendations(optimalScenario),
    };
  }

  private async performExploratoryAnalysis(params: any): Promise<any> {
    const { data } = params;

    // Perform multiple analyses
    const fields = Object.keys(data);
    const numericFields = fields.filter((f) =>
      typeof data[f][0] === 'number',
    );

    const distributions = numericFields.map((field) => ({
      field,
      stats: this.statisticalService.calculateDescriptiveStats(data[field]),
    }));

    const insights = this.generateExploratoryInsights(distributions);

    const visualizations = distributions.map((dist) =>
      this.visualizationService.generateHistogram(data[dist.field], 15, {
        title: `Distribution of ${dist.field}`,
      }),
    );

    return {
      summary: {
        fieldsAnalyzed: numericFields.length,
        recordCount: data[fields[0]]?.length || 0,
      },
      distributions,
      insights,
      visualizations,
    };
  }

  // Insight generation methods
  private generateDescriptiveInsights(stats: any, quality: any): string[] {
    const insights: string[] = [];

    insights.push(`Dataset contains ${stats.count} records with ${quality.qualityScore.toFixed(1)}% quality score`);
    insights.push(`Mean value: ${stats.mean.toFixed(2)}, Median: ${stats.median.toFixed(2)}`);

    if (Math.abs(stats.skewness) > 1) {
      insights.push(`Data shows ${stats.skewness > 0 ? 'positive' : 'negative'} skewness (${stats.skewness.toFixed(2)})`);
    }

    if (stats.coefficientOfVariation > 30) {
      insights.push(`High variability detected (CV: ${stats.coefficientOfVariation.toFixed(1)}%)`);
    }

    return insights;
  }

  private generateDiagnosticInsights(correlations: any): string[] {
    const insights: string[] = [];

    correlations.significantPairs.forEach((pair) => {
      insights.push(
        `Strong ${pair.correlation > 0 ? 'positive' : 'negative'} correlation between ${pair.var1} and ${pair.var2} (r=${pair.correlation.toFixed(3)})`,
      );
    });

    if (correlations.significantPairs.length === 0) {
      insights.push('No significant correlations detected between variables');
    }

    return insights;
  }

  private generatePredictiveInsights(trainingResult: any): string[] {
    const insights: string[] = [];

    if (trainingResult.performance?.r2Score) {
      insights.push(`Model explains ${(trainingResult.performance.r2Score * 100).toFixed(1)}% of variance`);
    }

    if (trainingResult.performance?.rmse) {
      insights.push(`Root Mean Square Error: ${trainingResult.performance.rmse.toFixed(4)}`);
    }

    return insights;
  }

  private generateExploratoryInsights(distributions: any[]): string[] {
    const insights: string[] = [];

    distributions.forEach((dist) => {
      if (Math.abs(dist.stats.skewness) > 1) {
        insights.push(`${dist.field}: Skewed distribution detected`);
      }
      if (dist.stats.coefficientOfVariation > 50) {
        insights.push(`${dist.field}: High variability observed`);
      }
    });

    return insights;
  }

  // Recommendation generation
  private generateDiagnosticRecommendations(correlations: any): string[] {
    const recommendations: string[] = [];

    if (correlations.significantPairs.length > 0) {
      recommendations.push('Consider multivariate analysis to explore relationships further');
      recommendations.push('Check for causality using controlled experiments');
    }

    return recommendations;
  }

  private generatePredictiveRecommendations(trainingResult: any): string[] {
    return [
      'Validate model on holdout test set',
      'Monitor model performance over time',
      'Consider ensemble methods for improved accuracy',
    ];
  }

  private generatePrescriptiveRecommendations(scenario: any): string[] {
    return [
      `Implement ${scenario.name} for optimal results`,
      'Monitor key metrics closely during implementation',
      'Prepare contingency plans for alternative scenarios',
    ];
  }

  private findOptimalScenario(
    scenarios: any[],
    constraints: any,
    objectives: any,
  ): any {
    // Simple scoring function
    const scored = scenarios.map((scenario) => ({
      ...scenario,
      score: this.calculateScenarioScore(scenario, objectives),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored[0];
  }

  private calculateScenarioScore(scenario: any, objectives: any): number {
    let score = 0;

    Object.keys(objectives).forEach((key) => {
      const weight = objectives[key].weight || 1;
      const target = objectives[key].target;
      const actual = scenario[key];

      if (typeof actual === 'number' && typeof target === 'number') {
        const proximity = 1 - Math.abs(actual - target) / target;
        score += proximity * weight;
      }
    });

    return score;
  }
}
