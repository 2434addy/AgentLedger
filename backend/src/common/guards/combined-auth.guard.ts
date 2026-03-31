import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeyThrottlerService } from './api-key-throttler.guard';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  private readonly logger = new Logger(CombinedAuthGuard.name);

  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
    private readonly throttlerService: ApiKeyThrottlerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try JWT first — dashboard users are handled by the global ThrottlerGuard
    try {
      const jwtResult = await this.jwtGuard.canActivate(context);
      if (jwtResult) return true;
    } catch (jwtError: unknown) {
      this.logger.debug(
        `JWT auth failed: ${jwtError instanceof Error ? jwtError.message : 'unknown error'}`,
      );
    }

    // Fall back to API key auth
    try {
      const apiKeyResult = await this.apiKeyGuard.canActivate(context);
      if (apiKeyResult) {
        // Apply per-org rate limiting for API key consumers only.
        // checkRateLimit throws HTTP 429 if the limit is exceeded.
        const request = context.switchToHttp().getRequest();
        await this.throttlerService.checkRateLimit(
          request.user.orgId,
          request.user.plan ?? 'free',
        );
        return true;
      }
    } catch (apiKeyError: unknown) {
      // Re-throw HttpExceptions (e.g. 429 Too Many Requests) without wrapping
      if (apiKeyError instanceof HttpException) throw apiKeyError;
      this.logger.debug(
        `API key auth failed: ${apiKeyError instanceof Error ? apiKeyError.message : 'unknown error'}`,
      );
    }

    throw new UnauthorizedException('Authentication required');
  }
}
