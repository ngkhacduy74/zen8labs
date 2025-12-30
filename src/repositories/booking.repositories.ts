import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { Booking, BookingStatus, BookingType, Court } from '@prisma/client';
import { QueryCourtDto } from 'src/dto/court/query-court.dto';

@Injectable()
export class BookingRepository {
  constructor(private prisma: PrismaService) {}
  async createManyFixed(
    rows: Array<{
      userId: number;
      courtId: number;
      startTime: Date;
      endTime: Date;
      totalPrice: number;
      notes?: string;
      type: BookingType;
      status: BookingStatus;
    }>,
  ): Promise<Booking[]> {
    return this.prisma.$transaction(
      rows.map((r) => this.prisma.booking.create({ data: r })),
    );
  }
  async createOnce(data: {
    userId: number;
    courtId: number;
    startTime: Date;
    endTime: Date;
    totalPrice: number;
    notes?: string;
    type: BookingType;
    status: BookingStatus;
  }): Promise<Booking> {
    return this.prisma.booking.create({
      data: {
        userId: data.userId,
        courtId: data.courtId,
        startTime: data.startTime,
        endTime: data.endTime,
        totalPrice: data.totalPrice,
        notes: data.notes,
        type: data.type,
        status: data.status,
      },
    });
  }
  async findBookingByUser(userId: number, status?: string): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: { userId, status: status ? (status as BookingStatus) : undefined },
      include: {
        court: {
          select: {
            id: true,
            name: true,
            location: true,
            price_per_hour: true,
            owner: {
              select: {
                id: true,
                fullname: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async findBookingByMaster(ownerId: number, status?: string) {
    return this.prisma.booking.findMany({
      where: {
        court: { ownerId: ownerId }, // Lọc theo chủ sân
        status: status ? (status as BookingStatus) : undefined,
      },
      include: {
        court: { select: { name: true } },
        user: {
          select: {
            fullname: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async findAllBookings(status?: string) {
    return this.prisma.booking.findMany({
      where: { status: status ? (status as BookingStatus) : undefined },
      include: {
        court: { select: { name: true } },
        user: { select: { fullname: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async findDetail(id: number) {
    return await this.prisma.booking.findUnique({
      where: { id },
      include: {
        court: {
          include: {
            owner: {
              select: {
                id: true,
                fullname: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullname: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }
  async findById(id: number) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: { court: true },
    });
  }

  async updateStatus(id: number, status: BookingStatus) {
    return this.prisma.booking.update({
      where: { id },
      data: { status },
    });
  }
}
