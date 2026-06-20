import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import {
  AvailabilityRangeQueryDto,
  AvailabilitySlotsQueryDto,
  CreateBusinessClosureDto,
  SetWeeklyAvailabilityDto,
} from './dto/availability.dto';
import { AvailabilityService } from './availability.service';

@ApiTags('Availability')
@Controller()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Put('businesses/:businessId/availability/weekly')
  @ApiBearerAuth()
  setWeeklyAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId') businessId: string,
    @Body() dto: SetWeeklyAvailabilityDto,
  ) {
    return this.availabilityService.setWeeklyAvailability(
      user,
      businessId,
      dto,
    );
  }

  @Get('businesses/:businessId/availability/weekly')
  @ApiBearerAuth()
  getWeeklyAvailability(@Param('businessId') businessId: string) {
    return this.availabilityService.getWeeklyAvailability(businessId);
  }

  @Post('businesses/:businessId/closures')
  @ApiBearerAuth()
  createClosure(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId') businessId: string,
    @Body() dto: CreateBusinessClosureDto,
  ) {
    return this.availabilityService.createClosure(user, businessId, dto);
  }

  @Get('businesses/:businessId/closures')
  @ApiBearerAuth()
  listClosures(@Param('businessId') businessId: string) {
    return this.availabilityService.listClosures(businessId);
  }

  @Delete('businesses/:businessId/closures/:closureId')
  @ApiBearerAuth()
  deleteClosure(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId') businessId: string,
    @Param('closureId') closureId: string,
  ) {
    return this.availabilityService.deleteClosure(user, businessId, closureId);
  }

  @Public()
  @Get('availability/businesses/:businessId/services/:serviceId/slots')
  getSlots(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @Query() query: AvailabilitySlotsQueryDto,
  ) {
    return this.availabilityService.getAvailableSlots(
      businessId,
      serviceId,
      query,
    );
  }

  @Public()
  @Get('availability/businesses/:businessId/services/:serviceId/range')
  getSlotsInRange(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @Query() query: AvailabilityRangeQueryDto,
  ) {
    return this.availabilityService.getAvailableRange(
      businessId,
      serviceId,
      query,
    );
  }
}
