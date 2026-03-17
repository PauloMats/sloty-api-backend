import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { AppointmentsService } from './appointments.service';
import {
  AppointmentRangeQueryDto,
  CancelAppointmentDto,
  CreateAppointmentDto,
} from './dto/appointment.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('appointments')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAppointmentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.appointmentsService.create(user, dto, idempotencyKey);
  }

  @Get('appointments/me')
  getMyAppointments(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.getMyAppointments(user);
  }

  @Get('appointments/:appointmentId')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.appointmentsService.getById(user, appointmentId);
  }

  @Patch('appointments/:appointmentId/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(user, appointmentId, dto);
  }

  @Patch('appointments/:appointmentId/confirm')
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.appointmentsService.confirm(user, appointmentId);
  }

  @Patch('appointments/:appointmentId/complete')
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.appointmentsService.complete(user, appointmentId);
  }

  @Patch('appointments/:appointmentId/no-show')
  noShow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.appointmentsService.noShow(user, appointmentId);
  }

  @Get('businesses/:businessId/appointments')
  getBusinessAppointments(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId') businessId: string,
  ) {
    return this.appointmentsService.listBusinessAppointments(user, businessId);
  }

  @Get('businesses/:businessId/appointments/calendar')
  getBusinessCalendar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId') businessId: string,
    @Query() query: AppointmentRangeQueryDto,
  ) {
    return this.appointmentsService.calendar(user, businessId, query);
  }
}
