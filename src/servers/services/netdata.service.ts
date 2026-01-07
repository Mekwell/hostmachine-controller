import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NetdataService {
  private readonly logger = new Logger(NetdataService.name);

  /**
   * Fetches real-time CPU and RAM usage for a specific Docker container.
   * @param nodeIp The internal IP of the node where the container is running
   * @param containerName The name or ID of the docker container
   */
  async getContainerStats(nodeIp: string, containerName: string) {
    try {
      const baseUrl = `http://${nodeIp}:19999`;
      // Netdata groups docker metrics under 'cgroup_NAME'
      const chartId = `cgroup_${containerName}`;

      // 1. Fetch CPU Usage (Total percentage)
      const cpuReq = axios.get(`${baseUrl}/api/v1/data`, {
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
      const ramReq = axios.get(`${baseUrl}/api/v1/data`, {
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
        cpu: cpuRes.data?.data?.[0] || 0, 
        ram: Math.round((ramRes.data?.data?.[0] || 0) / 1024 / 1024), 
        timestamp: Date.now()
      };

    } catch (error) {
      if (error.response?.status === 404) {
          return { cpu: 0, ram: 0, status: 'initializing' };
      }
      this.logger.warn(`Netdata unreachable on ${nodeIp}: ${error.message}`);
      return { cpu: 0, ram: 0, error: 'metrics_unavailable' };
    }
  }
}
