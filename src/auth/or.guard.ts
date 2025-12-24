import { CanActivate, ExecutionContext, Injectable, mixin, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

export const OrGuard = (...guards: Type<CanActivate>[]) => {
  @Injectable()
  class OrGuardImpl implements CanActivate {
    constructor(private moduleRef: ModuleRef) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      for (const guardType of guards) {
        const guard = this.moduleRef.get(guardType, { strict: false });
        if (await guard.canActivate(context)) {
          return true;
        }
      }
      return false;
    }
  }

  return mixin(OrGuardImpl);
};
