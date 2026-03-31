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
} from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ReviewApprovalDto } from './dto/review-approval.dto';
import { AuthRequest } from '../common/interfaces/request.interface';
import { ApprovalStatus } from './entities/approval.entity';

@Controller('approvals')
@UseGuards(CombinedAuthGuard, RolesGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateApprovalDto) {
    return this.approvalsService.create(req.user.orgId, dto);
  }

  @Get()
  list(@Req() req: AuthRequest, @Query('status') status?: ApprovalStatus) {
    return this.approvalsService.listByOrg(req.user.orgId, status);
  }

  @Get('pending')
  listPending(@Req() req: AuthRequest) {
    return this.approvalsService.listPending(req.user.orgId);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.approvalsService.findOne(req.user.orgId, id);
  }

  @Patch(':id/approve')
  @Roles('owner', 'admin')
  approve(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewApprovalDto,
  ) {
    return this.approvalsService.approve(req.user.orgId, id, req.user.id, dto.comment);
  }

  @Patch(':id/reject')
  @Roles('owner', 'admin')
  reject(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewApprovalDto,
  ) {
    return this.approvalsService.reject(req.user.orgId, id, req.user.id, dto.comment);
  }
}
