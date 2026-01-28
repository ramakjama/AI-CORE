import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [EmailModule, SmsModule, WebSocketModule, PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
