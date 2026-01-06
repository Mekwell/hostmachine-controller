import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NetdataService {
  private readonly logger = new Logger(NetdataService.name);

  // In a real multi-node setup, this should be dynamic based on where the server is hosted.
  private readonly NETDATA_HOST = process.env.NETDATA_URL || 'http://192.168.30.7:19999';

  /**
   * Fetches real-time CPU and RAM usage for a specific Docker container.
   * @param containerName The name or ID of the docker container
   */
  async getContainerStats(containerName: string) {
    try {
      // Netdata groups docker metrics under 'cgroup_NAME'
      // We need to sanitize the container name as Netdata does (dots to underscores usually)
      const chartId = `cgroup_${containerName}`;

      // 1. Fetch CPU Usage (Total percentage)
      // chart: cgroup_NAME.cpu_limit
      // dimensions: used
      const cpuReq = axios.get(`${this.NETDATA_HOST}/api/v1/data`, {
        params: {
          chart: `${chartId}.cpu_limit`,
          points: 1,
          after: -1,
          group: 'average',
          format: 'json',
          dimensions: 'used'
        }
      });

      // 2. Fetch RAM Usage (MB)
      // chart: cgroup_NAME.mem_usage_limit
      // dimensions: rss (Resident Set Size - actual memory used)
      const ramReq = axios.get(`${this.NETDATA_HOST}/api/v1/data`, {
        params: {
          chart: `${chartId}.mem_usage_limit`,
          points: 1,
          after: -1,
          group: 'average',
          format: 'json',
          dimensions: 'rss'
        }
      });

      const [cpuRes, ramRes] = await Promise.all([cpuReq, ramReq]);

      return {
        cpu: cpuRes.data.data[0] || 0, // Returns % (e.g. 150.5 for 1.5 cores)
        ram: Math.round((ramRes.data.data[0] || 0) / 1024 / 1024), // Bytes -> MB
        timestamp: Date.now()
      };

    } catch (error) {
      // If 404, the container might not be running or Netdata hasn't picked it up yet
      if (error.response?.status === 404) {
          return { cpu: 0, ram: 0, status: 'offline' };
      }
      this.logger.warn(`Failed to fetch stats for ${containerName}: ${error.message}`);
      return { cpu: 0, ram: 0, error: 'metrics_unavailable' };
    }
  }
}
