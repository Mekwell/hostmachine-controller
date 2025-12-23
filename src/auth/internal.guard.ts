import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const internalSecret = request.headers['x-internal-secret'];
    
    // Check against Environment Variable
    // In dev, defaults to 'insecure-secret' if not set
    const validSecret = process.env.INTERNAL_API_SECRET || 'insecure-secret';

    if (internalSecret !== validSecret) {
      // Log the attempt for security auditing
      console.warn(`Blocked unauthorized access attempt from ${request.ip}`);
      throw new UnauthorizedException('Access Denied: Internal Network Only');
    }

    return true;
  }
}
