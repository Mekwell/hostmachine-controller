import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly webhookUrl = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1453680490362966087/vv2cuoMzinE0BdN0X7xHcgesoBzeJuZA_M6QZ5DIxzAbrYhoh9h0qLP6DWtK606eHHI3';

  async sendAlert(title: string, message: string, level: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO') {
    let color = 0x3498db; // Blue
    if (level === 'WARNING') color = 0xf1c40f; // Yellow
    if (level === 'CRITICAL') color = 0xe74c3c; // Red

    const payload = {
      embeds: [
        {
          title: `[HostMachine] ${title}`,
          description: message,
          color: color,
          timestamp: new Date().toISOString(),
          footer: {
            text: `Level: ${level}`
          }
        }
      ]
    };

    try {
      await axios.post(this.webhookUrl, payload);
      this.logger.log(`Alert sent: ${title}`);
    } catch (error: any) {
      this.logger.error(`Failed to send alert: ${error.message}`);
    }
  }
}
