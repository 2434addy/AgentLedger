import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller()
@SkipThrottle()
export class HealthController {
  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check — returns service status and timestamp' })
  @ApiResponse({ status: 200, description: 'Service is healthy.' })
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
