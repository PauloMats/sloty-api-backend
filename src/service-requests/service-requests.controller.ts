import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import {
  CreateServiceProposalDto,
  CreateServiceRequestDto,
  ListServiceRequestsQueryDto,
} from './dto/service-request.dto';
import { ServiceRequestsService } from './service-requests.service';

@ApiTags('Service Requests')
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Post()
  @ApiBearerAuth()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateServiceRequestDto,
  ) {
    return this.serviceRequestsService.create(user, dto);
  }

  @Public()
  @Get('open')
  listOpen(@Query() query: ListServiceRequestsQueryDto) {
    return this.serviceRequestsService.listOpen(query);
  }

  @Get('me')
  @ApiBearerAuth()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.serviceRequestsService.listMine(user);
  }

  @Get(':requestId')
  @ApiBearerAuth()
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId') requestId: string,
  ) {
    return this.serviceRequestsService.getById(user, requestId);
  }

  @Post(':requestId/proposals')
  @ApiBearerAuth()
  createProposal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId') requestId: string,
    @Body() dto: CreateServiceProposalDto,
  ) {
    return this.serviceRequestsService.createProposal(user, requestId, dto);
  }

  @Patch(':requestId/proposals/:proposalId/accept')
  @ApiBearerAuth()
  acceptProposal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId') requestId: string,
    @Param('proposalId') proposalId: string,
  ) {
    return this.serviceRequestsService.acceptProposal(
      user,
      requestId,
      proposalId,
    );
  }
}
