import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { NodesService } from '../nodes/nodes.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private authCache: Map<string, { isValid: boolean, expiry: number }> = new Map();

  constructor(private nodesService: NodesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const nodeId = request.headers['x-node-id'] as string;
    const apiKey = request.headers['x-api-key'] as string;

    if (!nodeId || !apiKey) {
      return false;
    }

    const cacheKey = `${nodeId}:${apiKey}`;
    const cached = this.authCache.get(cacheKey);
    const now = Date.now();

    if (cached && now < cached.expiry) {
        return cached.isValid;
    }

    const isValid = await this.nodesService.validateApiKey(nodeId, apiKey);
    
    // Cache for 5 minutes
    this.authCache.set(cacheKey, { isValid, expiry: now + (5 * 60 * 1000) });

    if (!isValid) {
      console.warn(`[ApiKeyGuard] Invalid credentials for NodeID: ${nodeId}`);
      return false;
    }

    return true;
  }
}
