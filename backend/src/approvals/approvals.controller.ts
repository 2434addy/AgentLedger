import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ReviewApprovalDto } from './dto/review-approval.dto';
import { AuthRequest } from '../common/interfaces/request.interface';
import { ApprovalStatus } from './entities/approval.entity';

@ApiTags('approvals')
@ApiBearerAuth()
@ApiSecurity('api-key')
@Controller('approvals')
@UseGuards(CombinedAuthGuard, RolesGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  @ApiOperation({ summary: 'Request a human-in-the-loop approval for an agent action' })
  @ApiResponse({ status: 201, description: 'Approval request created.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  create(@Req() req: AuthRequest, @Body() dto: CreateApprovalDto) {
    const authenticatedUserId = req.user.id ?? req.user.userId;
    if (!authenticatedUserId) {
      throw new BadRequestException('Could not determine authenticated user ID');
    }
    return this.approvalsService.create(req.user.orgId, dto, authenticatedUserId);
  }

  @Get()
  @ApiOperation({ summary: 'List all approvals, optionally filtered by status' })
  @ApiResponse({ status: 200, description: 'List of approval requests.' })
  @ApiResponse({ status: 400, description: 'Invalid status value.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  list(@Req() req: AuthRequest, @Query('status') status?: string) {
    const validStatuses = Object.values(ApprovalStatus);
    if (status && !validStatuses.includes(status as ApprovalStatus)) {
      throw new BadRequestException(`status must be one of: ${validStatuses.join(', ')}`);
    }
    return this.approvalsService.listByOrg(req.user.orgId, status as ApprovalStatus | undefined);
  }

  @Get('pending')
  @ApiOperation({ summary: 'List all approvals in pending state' })
  @ApiResponse({ status: 200, description: 'List of pending approval requests.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  listPending(@Req() req: AuthRequest) {
    return this.approvalsService.listPending(req.user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single approval request by ID' })
  @ApiResponse({ status: 200, description: 'Approval record.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 404, description: 'Approval not found.' })
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.approvalsService.findOne(req.user.orgId, id);
  }

  @Patch(':id/approve')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Approve a pending request (owner/admin only)' })
  @ApiResponse({ status: 200, description: 'Approval granted.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient role.' })
  @ApiResponse({ status: 404, description: 'Approval not found.' })
  approve(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewApprovalDto,
  ) {
    return this.approvalsService.approve(req.user.orgId, id, req.user.id, dto.comment);
  }

  @Patch(':id/reject')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Reject a pending request (owner/admin only)' })
  @ApiResponse({ status: 200, description: 'Approval rejected.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient role.' })
  @ApiResponse({ status: 404, description: 'Approval not found.' })
  reject(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewApprovalDto,
  ) {
    return this.approvalsService.reject(req.user.orgId, id, req.user.id, dto.comment);
  }
}
