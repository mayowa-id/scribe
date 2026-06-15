import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface SendNotificationPayload {
  recipient: string;
  subject: string;
  body: string;
  idempotencyKey: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly baseUrl: string;
  private readonly fromEmail: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('NOTISCOPE_BASE_URL', 'http://13.60.84.255:8000');
    this.fromEmail = this.configService.get<string>('NOTISCOPE_FROM_EMAIL', 'noreply@scribe.app');
  }

  /**
   * Fire-and-forget email via Notiscope.
   * Never throws — email failures must never block auth or business logic.
   */
  async send(payload: SendNotificationPayload): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/notify`,
          {
            recipient: payload.recipient,
            subject: payload.subject,
            body: payload.body,
            from_email: this.fromEmail,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': payload.idempotencyKey,
            },
            timeout: 5000,
          },
        ),
      );
      this.logger.log(`Email sent → ${payload.recipient} [${payload.idempotencyKey}]`);
    } catch (err: any) {
      // Intentionally swallowed — Notiscope handles its own retry logic
      this.logger.warn(
        `Notiscope delivery failed [${payload.idempotencyKey}]: ${err?.message ?? err}`,
      );
    }
  }
}
