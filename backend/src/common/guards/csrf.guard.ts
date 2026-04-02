import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import * as crypto from 'crypto';

/**
 * Double-submit cookie CSRF protection.
 * On login/signup/refresh, the auth controller sets a non-httpOnly CSRF cookie.
 * On state-changing requests (POST/PUT/PATCH/DELETE), this guard validates
 * that the X-CSRF-Token header matches the csrf cookie value.
 *
 * Exemptions:
 * - @Public() endpoints (login, signup, forgot-password)
 * - Requests authenticated via x-api-key header (API key auth is CSRF-immune)
 * - GET/HEAD/OPTIONS requests (safe methods)
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      method: string;
      headers: Record<string, string | undefined>;
      cookies?: Record<string, string>;
    }>();
    const method = request.method?.toUpperCase();

    // Safe methods don't need CSRF protection
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

    // Public endpoints are exempt (login, signup, etc.)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // API key authenticated requests are CSRF-immune (no cookie involved)
    if (request.headers['x-api-key']) return true;

    // Double-submit validation: header must match cookie
    const cookieToken = request.cookies?.['csrf-token'];
    const headerToken = request.headers['x-csrf-token'];

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    // Constant-time comparison to prevent timing attacks
    if (cookieToken.length !== headerToken.length) {
      throw new ForbiddenException('CSRF token invalid');
    }

    const valid = crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken),
    );

    if (!valid) {
      throw new ForbiddenException('CSRF token invalid');
    }

    return true;
  }
}
