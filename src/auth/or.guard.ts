import { CanActivate, ExecutionContext, Injectable, mixin, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

export const OrGuard = (...guards: Type<CanActivate>[]) : any => {
  @Injectable()
  class OrGuardImpl implements CanActivate {
    constructor(public moduleRef: ModuleRef) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      for (const guardType of guards) {
        try {
          const guard = this.moduleRef.get(guardType, { strict: false });
          const result = await guard.canActivate(context);
          if (result) {
            return true;
          }
        } catch (e: any) {
          // If a guard throws, we log it but continue to the next one
          console.log(`[OrGuard] Guard ${guardType.name} failed or threw: ${e.message}`);
        }
      }
      
      const req = context.switchToHttp().getRequest();
      console.warn(`[OrGuard] All guards failed for ${req.method} ${req.url} from ${req.ip}`);
      return false;
    }
  }

  return mixin(OrGuardImpl);
};