import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { BookingRepository } from 'src/repositories/booking.repositories';
import { Booking, BookingStatus, BookingType, Role } from '@prisma/client';
import { CreateBookingDto } from 'src/dto/booking/create-booking.dto';
import { CourtRepository } from 'src/repositories/court.repositories';
import { CreateFixedBookingDto } from 'src/dto/booking/create-fixed-booking.dto';

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly courtRepository: CourtRepository,
  ) {}
  async createOnce(dto: CreateBookingDto, userId: number): Promise<Booking> {
    try {
      const { start, end } = this.parseTime(dto.startTime, dto.endTime);
      const court = await this.courtRepository.findById(dto.courtId);
      if (!court) throw new NotFoundException('Không tìm thấy sân');
      if (!court.status)
        throw new BadRequestException('Sân đang tạm ngưng hoạt động');
      const conflict = await this.courtRepository.getCourtSchedule(
        dto.courtId,
        start,
        end,
      );
      if (conflict.length > 0)
        throw new ConflictException('Lịch sân đã có người sử dụng');
      const totalPrice = this.calcTotal(court.price_per_hour, start, end);
      return await this.bookingRepository.createOnce({
        userId,
        courtId: dto.courtId,
        startTime: start,
        endTime: end,
        totalPrice,
        notes: dto.notes,
        type: BookingType.Casual,
        status: BookingStatus.Pending,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to create booking');
    }
  }

  async createFixed(dto: CreateFixedBookingDto, userId: number) {
  try {
    const court = await this.courtRepository.findById(dto.courtId);
    if (!court) throw new NotFoundException('Không tìm thấy sân');
    if (!court.status)
      throw new BadRequestException('Sân đang tạm ngưng hoạt động');

    const base = new Date(dto.startDate);
    if (isNaN(base.getTime())) {
      throw new BadRequestException('startDate không hợp lệ');
    }
    base.setHours(0, 0, 0, 0);

    if (!dto.daysOfWeek || dto.daysOfWeek.length === 0) {
      throw new BadRequestException('daysOfWeek không được rỗng');
    }

    const uniqueDays = Array.from(new Set(dto.daysOfWeek)).sort((a, b) => a - b);

    const rows: Array<{
      userId: number;
      courtId: number;
      startTime: Date;
      endTime: Date;
      totalPrice: number;
      notes?: string;
      type: BookingType;
      status: BookingStatus;
    }> = [];

    const firstDateForDow = (dow: number) => {
      const diff = (dow - base.getDay() + 7) % 7;
      const first = new Date(base);
      first.setDate(base.getDate() + diff);
      return first;
    };

    for (let weekIndex = 0; weekIndex < dto.weeks; weekIndex++) {
      for (const dow of uniqueDays) {
        const first = firstDateForDow(dow);

        const day = new Date(first);
        day.setDate(first.getDate() + weekIndex * 7);

        const start = new Date(day);
        start.setHours(dto.startHour, 0, 0, 0);

        const end = new Date(start);
        end.setHours(start.getHours() + dto.durationHours);

        if (end <= start) {
          throw new BadRequestException('durationHours không hợp lệ');
        }

        const conflict = await this.courtRepository.getCourtSchedule(
          dto.courtId,
          start,
          end,
        );

        if (conflict.length > 0) {
          throw new ConflictException(
            `Trùng lịch tuần ${weekIndex + 1} (dow=${dow}) (${start.toISOString()} - ${end.toISOString()})`,
          );
        }

        const ms = end.getTime() - start.getTime();
        const hours = ms / (1000 * 60 * 60);
        const totalPrice = court.price_per_hour * hours;

        rows.push({
          userId,
          courtId: dto.courtId,
          startTime: start,
          endTime: end,
          totalPrice,
          notes: dto.notes,
          type: BookingType.Monthly,
          status: BookingStatus.Pending,
        });
      }
    }

    const bookings = await this.bookingRepository.createManyFixed(rows);
    return { count: bookings.length, bookings };
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throw new InternalServerErrorException('Failed to create fixed bookings');
  }
}

  async getMyBookings(
    userId: number,
    role: Role,
    status?: string,
  ): Promise<Booking[]> {
    try {
      switch (role) {
        case Role.Admin:
          return await this.bookingRepository.findAllBookings(status);

        case Role.Master:
          return await this.bookingRepository.findBookingByMaster(
            userId,
            status,
          );

        case Role.User:
          return await this.bookingRepository.findBookingByUser(userId, status);

        default:
          return [];
      }
    } catch (error) {
      console.error('Error in getMyBookings:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi lấy danh sách lịch đặt',
      );
    }
  }
  async getDetail(bookingId: number, userId: number, role: Role) {
    const booking = await this.bookingRepository.findDetail(bookingId);

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin lịch đặt này');
    }

    if (role === Role.User) {
      if (booking.userId !== userId) {
        throw new ForbiddenException(
          'Bạn không có quyền xem chi tiết lịch đặt này',
        );
      }
    } else if (role === Role.Master) {
      if (booking.court.ownerId !== userId) {
        throw new ForbiddenException(
          'Lịch đặt này không thuộc sân bạn quản lý',
        );
      }
    }

    return booking;
  }
  async cancel(bookingId: number, userId: number, role: Role) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Không tìm thấy lịch đặt để hủy');

    if (role === Role.User && booking.userId !== userId) {
      throw new ForbiddenException('Bạn không thể hủy lịch của người khác');
    }

    if (role === Role.Master && booking.court.ownerId !== userId) {
      throw new ForbiddenException(
        'Bạn chỉ có thể hủy lịch đặt tại sân của mình',
      );
    }

    if (booking.status === BookingStatus.Cancelled) {
      throw new BadRequestException('Lịch này đã được hủy rồi');
    }
    return await this.bookingRepository.updateStatus(
      bookingId,
      BookingStatus.Cancelled,
    );
  }

  private parseTime(startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('startTime/endTime không hợp lệ');
    }

    return { start, end };
  }
  private calcTotal(pricePerHour: number, start: Date, end: Date) {
    const ms = end.getTime() - start.getTime();
    const hours = ms / (1000 * 60 * 60);
    return pricePerHour * hours;
  }
}
