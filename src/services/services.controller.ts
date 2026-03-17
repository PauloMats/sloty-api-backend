import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreateCatalogServiceDto, UpdateCatalogServiceDto } from './dto/service.dto';
import { ServicesService } from './services.service';

@ApiTags('Services')
@Controller('businesses/:businessId/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiBearerAuth()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId') businessId: string,
    @Body() dto: CreateCatalogServiceDto,
  ) {
    return this.servicesService.create(user, businessId, dto);
  }

  @Public()
  @Get()
  list(@Param('businessId') businessId: string) {
    return this.servicesService.list(businessId);
  }

  @Patch(':serviceId')
  @ApiBearerAuth()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateCatalogServiceDto,
  ) {
    return this.servicesService.update(user, businessId, serviceId, dto);
  }

  @Delete(':serviceId')
  @ApiBearerAuth()
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.servicesService.remove(user, businessId, serviceId);
  }
}
