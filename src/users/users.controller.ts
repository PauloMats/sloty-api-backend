import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import {
  CreateUserAddressDto,
  DeleteMyAccountDto,
  UpdateMeDto,
  UpdateNotificationPreferencesDto,
  UpdateUserAddressDto,
} from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @Get('me/export')
  exportMyData(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.exportMyData(user.sub);
  }

  @Delete('me')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  deleteMyAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteMyAccountDto,
  ) {
    return this.usersService.anonymizeMyAccount(user.sub, dto);
  }

  @Get('me/addresses')
  listAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listAddresses(user.sub);
  }

  @Post('me/addresses')
  createAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUserAddressDto,
  ) {
    return this.usersService.createAddress(user.sub, dto);
  }

  @Patch('me/addresses/:addressId')
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateUserAddressDto,
  ) {
    return this.usersService.updateAddress(user.sub, addressId, dto);
  }

  @Patch('me/addresses/:addressId/default')
  setDefaultAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.setDefaultAddress(user.sub, addressId);
  }

  @Delete('me/addresses/:addressId')
  deleteAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.deleteAddress(user.sub, addressId);
  }

  @Get('me/notification-preferences')
  getNotificationPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getNotificationPreferences(user.sub);
  }

  @Patch('me/notification-preferences')
  updateNotificationPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.usersService.updateNotificationPreferences(user.sub, dto);
  }
}
