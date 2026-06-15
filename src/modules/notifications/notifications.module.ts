import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
