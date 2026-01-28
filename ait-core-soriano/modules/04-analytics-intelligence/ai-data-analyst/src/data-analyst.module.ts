import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DataAnalystController } from './controllers/data-analyst.controller';
import { DataAnalystService } from './services/data-analyst.service';
import { MLModelService } from './services/ml-model.service';
import { StatisticalAnalysisService } from './services/statistical-analysis.service';
import { DataProcessingService } from './services/data-processing.service';
import { DataVisualizationService } from './services/data-visualization.service';
import { TimeSeriesAnalysisService } from './services/time-series-analysis.service';
import { AnalysisReport } from './entities/analysis-report.entity';
import { DataSet } from './entities/dataset.entity';
import { MLModel } from './entities/ml-model.entity';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([AnalysisReport, DataSet, MLModel]),
  ],
  controllers: [DataAnalystController],
  providers: [
    DataAnalystService,
    MLModelService,
    StatisticalAnalysisService,
    DataProcessingService,
    DataVisualizationService,
    TimeSeriesAnalysisService,
  ],
  exports: [DataAnalystService, MLModelService],
})
export class DataAnalystModule {}
