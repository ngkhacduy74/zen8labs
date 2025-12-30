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
  private readonly OFFSET_MS = 7 * 60 * 60 * 1000;

  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly courtRepository: CourtRepository,
  ) {}

  private normalizeTime(input: string | Date): Date {
    const d = new Date(input);
    if (isNaN(d.getTime())) throw new BadRequestException('Invalid Date');
    return new Date(d.getTime() - this.OFFSET_MS);
  }

  private formatLocalTime(date: Date): string {
    const local = new Date(date.getTime() + this.OFFSET_MS);
    return local.toISOString().replace('Z', '').replace('T', ' ').slice(0, 16); // "YYYY-MM-DD HH:mm"
  }

  async createOnce(dto: CreateBookingDto, userId: number): Promise<any> {
    try {
      const start = this.normalizeTime(dto.startTime);
      const end = this.normalizeTime(dto.endTime);

      if (end <= start) {
        throw new BadRequestException('Thời gian kết thúc phải sau bắt đầu');
      }

      const court = await this.courtRepository.findById(dto.courtId);
      if (!court) throw new NotFoundException('Không tìm thấy sân');
      if (!court.status)
        throw new BadRequestException('Sân đang tạm ngưng hoạt động');

      const conflict = await this.courtRepository.getCourtSchedule(
        dto.courtId,
        start,
        end,
      );

      if (conflict.length > 0) {
        throw new ConflictException(
          `Trùng lịch: ${this.formatLocalTime(start)} - ${this.formatLocalTime(end)}`,
        );
      }

      const totalPrice = this.calcTotal(court.price_per_hour, start, end);

      const newBooking = await this.bookingRepository.createOnce({
        userId,
        courtId: dto.courtId,
        startTime: start,
        endTime: end,
        totalPrice,
        notes: dto.notes,
        type: dto.type || BookingType.Casual,
        status: BookingStatus.Pending,
      });

      return {
        ...newBooking,
        message_time: `Đã đặt sân từ ${this.formatLocalTime(start)} đến ${this.formatLocalTime(end)} (Giờ VN)`,
      };
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

      const baseLocal = new Date(dto.startDate); 
      if (isNaN(baseLocal.getTime()))
        throw new BadRequestException('startDate invalid');
      
      const baseYear = baseLocal.getUTCFullYear();
      const baseMonth = baseLocal.getUTCMonth();
      const baseDate = baseLocal.getUTCDate();
      
      const rows: Array<any> = [];

      for (const dayOfWeek of dto.daysOfWeek) {
        const currentDayIndex = new Date(Date.UTC(baseYear, baseMonth, baseDate)).getUTCDay();
        const diff = (dayOfWeek - currentDayIndex + 7) % 7;
        
        const firstMatchDateVal = baseDate + diff;

        for (let i = 0; i < dto.weeks; i++) {
          const targetDateVal = firstMatchDateVal + i * 7;

          const startTimestamp = Date.UTC(baseYear, baseMonth, targetDateVal, dto.startHour, 0, 0);
          const endTimestamp = Date.UTC(baseYear, baseMonth, targetDateVal, dto.startHour + dto.durationHours, 0, 0);

          const start = new Date(startTimestamp - this.OFFSET_MS); // Apply -7h shift
          const end = new Date(endTimestamp - this.OFFSET_MS);   // Apply -7h shift

          if (end <= start) throw new BadRequestException('Duration invalid');

          const conflict = await this.courtRepository.getCourtSchedule(
            dto.courtId,
            start,
            end,
          );

          if (conflict.length > 0) {
            throw new ConflictException(
              `Trùng lịch cố định: ${this.formatLocalTime(start)}`,
            );
          }
          const hours = (end.getTime() - start.getTime()) / (3600 * 1000);
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

      if (rows.length === 0)
        throw new BadRequestException('Không tạo được lịch nào');

      const bookings = await this.bookingRepository.createManyFixed(rows);
      return { count: bookings.length, bookings };

    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to create fixed bookings');
    }
  }

  async getMyBookings(userId: number, role: Role, status?: string) {
     if (role === Role.Admin) return this.bookingRepository.findAllBookings(status);
     if (role === Role.Master) return this.bookingRepository.findBookingByMaster(userId, status);
     return this.bookingRepository.findBookingByUser(userId, status);
  }

  async getDetail(bookingId: number, userId: number, role: Role) {
    const booking = await this.bookingRepository.findDetail(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
        if (role === Role.User && booking.userId !== userId) throw new ForbiddenException('No permission');
    if (role === Role.Master && booking.court.ownerId !== userId) throw new ForbiddenException('No permission');
    
    return booking;
  }

  async cancel(bookingId: number, userId: number, role: Role) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    
    if (role === Role.User && booking.userId !== userId) throw new ForbiddenException('No permission');
    if (role === Role.Master && booking.court.ownerId !== userId) throw new ForbiddenException('No permission');
    
    if (booking.status === BookingStatus.Cancelled) throw new BadRequestException('Already cancelled');
    
    return await this.bookingRepository.updateStatus(bookingId, BookingStatus.Cancelled);
  }

  private calcTotal(pricePerHour: number, start: Date, end: Date) {
    const ms = end.getTime() - start.getTime();
    return pricePerHour * (ms / 3600000);
  }
}
