import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from './entities/email-template.entity';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private readonly webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(EmailTemplate)
    private templateRepository: Repository<EmailTemplate>,
  ) {
    // Initialize SMTP Transporter
    if (process.env.SMTP_HOST) {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '2525'),
            secure: false, // TLS requires secure:true, usually SMTP2GO uses STARTTLS on 2525
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
  }

  async onModuleInit() {
      // Seed default templates
      await this.seedTemplate('welcome', 'Welcome to HostMachine', 
        `<h1>Welcome, {{name}}!</h1><p>Your account has been created.</p><a href="{{link}}">Verify Email</a>`);
      
      await this.seedTemplate('verify', 'Verify your Email', 
        `<p>Please click here to verify: <a href="{{link}}">Verify Now</a></p>`);
  }

  private async seedTemplate(name: string, subject: string, body: string) {
      const exists = await this.templateRepository.findOneBy({ name });
      if (!exists) {
          await this.templateRepository.save({ name, subject, body });
      }
  }

  async sendEmail(to: string, templateName: string, variables: Record<string, string>) {
      const template = await this.templateRepository.findOneBy({ name: templateName });
      if (!template) {
          this.logger.error(`Template ${templateName} not found.`);
          return;
      }

      let html = template.body;
      let subject = template.subject;

      // Replace variables
      for (const [key, value] of Object.entries(variables)) {
          html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
          subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      if (this.transporter) {
          try {
              await this.transporter.sendMail({
                  from: '"HostMachine" <noreply@hostmachine.com.au>',
                  to,
                  subject,
                  html,
              });
              this.logger.log(`Email sent to ${to} [${templateName}]`);
          } catch (e: any) {
              this.logger.error(`Failed to send email: ${e.message}`);
          }
      } else {
          this.logger.warn(`[Mock Email] To: ${to} | Subject: ${subject} | Link: ${variables.link}`);
      }
  }

  async sendAlert(title: string, message: string, level: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO') {
    if (!this.webhookUrl) return;
    
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
