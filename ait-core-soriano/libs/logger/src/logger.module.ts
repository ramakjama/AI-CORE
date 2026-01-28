import { Module, Global } from '@nestjs/common';
import { ELKLoggerService } from './elk-logger.service';

@Global()
@Module({
  providers: [ELKLoggerService],
  exports: [ELKLoggerService],
})
export class LoggerModule {}
