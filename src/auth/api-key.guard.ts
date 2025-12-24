import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { NodesService } from '../nodes/nodes.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private nodesService: NodesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const nodeId = request.headers['x-node-id'];
    const apiKey = request.headers['x-api-key'];

    console.log(`[ApiKeyGuard] Auth Check - NodeID: ${nodeId}, ApiKey: ${apiKey ? 'PRESENT' : 'MISSING'}`);

    if (!nodeId || !apiKey) {
      return false;
    }

    const isValid = await this.nodesService.validateApiKey(nodeId, apiKey);
    
    if (!isValid) {
      console.warn(`[ApiKeyGuard] Invalid credentials for NodeID: ${nodeId}`);
      return false;
    }

    return true;
  }
}
