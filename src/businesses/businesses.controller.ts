import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';

@ApiTags('Businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @ApiBearerAuth()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBusinessDto) {
    return this.businessesService.create(user, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.businessesService.getMyBusiness(user);
  }

  @Patch('me')
  @ApiBearerAuth()
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateBusinessDto) {
    return this.businessesService.updateMyBusiness(user, dto);
  }

  @Public()
  @Get()
  list() {
    return this.businessesService.list();
  }

  @Public()
  @Get(':businessId')
  getById(@Param('businessId') businessId: string) {
    return this.businessesService.getById(businessId);
  }

  @Public()
  @Get(':businessId/public')
  getPublic(@Param('businessId') businessId: string) {
    return this.businessesService.getPublicById(businessId);
  }
}
