import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DnsService {
  private readonly logger = new Logger(DnsService.name);
  private readonly apiToken = process.env.CF_API_TOKEN;
  private readonly zoneId = process.env.CF_ZONE_ID;
  private readonly domain = process.env.CF_DOMAIN || 'hostmachine.net';

  /**
   * Sanitizes a server name to be DNS-safe.
   * e.g. "My Cool Server!" -> "my-cool-server"
   */
  sanitize(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-')         // Collapse multiple hyphens
      .replace(/^-|-$/g, '')       // Trim leading/trailing hyphens
      .substring(0, 63);           // Max DNS label length
  }

  async createRecord(subdomain: string, targetIp: string, port?: number) {
    if (!this.apiToken || !this.zoneId) {
      this.logger.warn('Cloudflare credentials missing. Skipping DNS registration.');
      return null;
    }

    const fullDomain = `${subdomain}.${this.domain}`;
    this.logger.log(`Creating DNS records for ${fullDomain} -> ${targetIp}`);

    try {
      // 1. Create A Record
      // subdomain.hostmachine.net -> 1.2.3.4
      await this.postRecord({
        type: 'A',
        name: subdomain,
        content: targetIp,
        ttl: 120, // Short TTL for dynamic gaming IPs
        proxied: false // CRITICAL: Must be false for non-HTTP traffic
      });

      // 2. Create SRV Record (if port is standard Minecraft/Source, etc)
      // This allows connecting via "subdomain.hostmachine.net" without port
      if (port && port !== 25565 && port !== 27015) { // Only if not default? Or always? Always is safer.
          // _minecraft._tcp.subdomain
          // Actually, typical usage: _minecraft._tcp.play.hostmachine.net
          // But if the A record is "subdomain", the SRV should be attached to that name.
          // Cloudflare UI: Name = _minecraft._tcp.subdomain
          
          // However, many games don't support SRV properly (Rust doesn't).
          // Minecraft does.
          // For now, we'll stick to just the A record to ensure reliability across all games.
          // Users can type the port.
      }

      return fullDomain;
    } catch (error: any) {
      this.logger.error(`Failed to create DNS record: ${error.message}`);
      return null;
    }
  }

  async deleteRecord(subdomain: string) {
    if (!this.apiToken || !this.zoneId) return;

    try {
      // 1. Find the record ID
      const records = await this.listRecords(subdomain);
      
      // 2. Delete all matches
      for (const record of records) {
          await this.deleteRecordId(record.id);
      }
      this.logger.log(`Deleted DNS records for ${subdomain}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete DNS record: ${error.message}`);
    }
  }

  private async listRecords(name: string) {
      const url = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?name=${name}.${this.domain}`;
      const res = await fetch(url, {
          headers: {
              'Authorization': `Bearer ${this.apiToken}`,
              'Content-Type': 'application/json'
          }
      });
      const json: any = await res.json();
      return json.result || [];
  }

  private async deleteRecordId(id: string) {
      await fetch(`https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records/${id}`, {
          method: 'DELETE',
          headers: {
              'Authorization': `Bearer ${this.apiToken}`,
              'Content-Type': 'application/json'
          }
      });
  }

  private async postRecord(data: any) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const json: any = await response.json();
    if (!json.success) {
      throw new Error(json.errors?.[0]?.message || 'Unknown Cloudflare Error');
    }
    return json.result;
  }
}
