import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/decorators/role.decorator';
import { User } from 'src/decorators/user.decorator';
import { AuthGuard } from 'src/guards/token.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Role } from '@prisma/client';

import { BookingService } from 'src/services/booking.service';
import { CreateBookingDto } from 'src/dto/booking/create-booking.dto';
import { CreateFixedBookingDto } from 'src/dto/booking/create-fixed-booking.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin, Role.Master)
  @Post()
  async createOnce(@Body() dto: CreateBookingDto, @User('sub') userId: number) {
    const data = await this.bookingService.createOnce(dto, userId);
    return { message: 'Đặt lịch 1 lần thành công (Pending)', data };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin, Role.Master)
  @Post('fixed')
  async createFixed(
    @Body() dto: CreateFixedBookingDto,
    @User('sub') userId: number,
  ) {
    const data = await this.bookingService.createFixed(dto, userId);
    return { message: 'Đặt lịch cố định thành công (Pending)', data };
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles(Role.User, Role.Admin, Role.Master)
  // @Post(':id/pay')
  // async pay(
  //   @Param('id', ParseIntPipe) bookingId: number,
  //   @User('sub') userId: number,
  //   @User('role') role: string,
  // ) {
  //   const data = await this.bookingService.pay(bookingId, userId, role);
  //   return { message: 'Thanh toán thành công (Confirmed)', data };
  // }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin, Role.Master)
  @Get('me')
  async myBookings(
    @User('sub') userId: number,
    @User('role') role: Role,
    @Query('status') status?: string,
  ) {
    const data = await this.bookingService.getMyBookings(userId, role, status);
    return { message: 'Lấy danh sách lịch đã đặt thành công', data };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin, Role.Master)
  @Get(':id')
  async detail(
    @Param('id', ParseIntPipe) bookingId: number,
    @User('sub') userId: number,
    @User('role') role: Role,
  ) {
    const data = await this.bookingService.getDetail(bookingId, userId, role);
    return { message: 'Lấy chi tiết booking thành công', data };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin, Role.Master)
  @Post(':id/cancel')
  async cancel(
    @Param('id', ParseIntPipe) bookingId: number,
    @User('sub') userId: number,
    @User('role') role: Role,
  ) {
    const data = await this.bookingService.cancel(bookingId, userId, role);
    return { message: 'Huỷ booking thành công', data };
  }
}
