import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from './api-key.guard';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private jwtGuard: JwtAuthGuard,
    private apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try JWT first
    try {
      const jwtResult = await this.jwtGuard.canActivate(context);
      if (jwtResult) return true;
    } catch (jwtError: unknown) {
      // JWT failed — expected when using API key auth, continue
    }

    // Fall back to API key
    try {
      const apiKeyResult = await this.apiKeyGuard.canActivate(context);
      if (apiKeyResult) return true;
    } catch (apiKeyError: unknown) {
      // API key also failed
    }

    throw new UnauthorizedException('Authentication required');
  }
}
