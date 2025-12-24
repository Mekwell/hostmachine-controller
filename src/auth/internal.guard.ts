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
      return false;
    }

    return true;
  }
}
