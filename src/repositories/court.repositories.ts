// src/repositories/court.repositories.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { BookingStatus, Court } from '@prisma/client';
import { QueryCourtDto } from 'src/dto/court/query-court.dto';

@Injectable()
export class CourtRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Court> {
    return await this.prisma.court.create({ data });
  }

  async findById(
    id: number,
    ownerId?: number,
    activeOnly = false,
  ): Promise<Court | null> {
    return await this.prisma.court.findFirst({
      where: {
        id,
        ...(ownerId !== undefined && { ownerId }),
        ...(activeOnly && { status: true }),
      },
    });
  }

  async findAll(query: QueryCourtDto, ownerId?: number, activeOnly = false) {
    const { page = 1, limit = 10, location } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(location && {
        location: { contains: location, mode: 'insensitive' },
      }),
      ...(ownerId !== undefined && { ownerId }),
      ...(activeOnly && { status: true }),
    };

    const [items, total] = await Promise.all([
      this.prisma.court.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.court.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: number, data: any, ownerId?: number): Promise<Court | null> {
    const court = await this.prisma.court.findFirst({
      where: {
        id,
        ...(ownerId !== undefined && { ownerId }),
      },
    });

    if (!court) return null;

    return await this.prisma.court.update({
      where: { id },
      data,
    });
  }
  async softDelete(id: number, body: any): Promise<Court | null> {
    const court = await this.prisma.court.findUnique({
      where: { id },
    });
    if (!court) return null;
    return await this.prisma.court.update({
      where: { id },
      data: { ...body, status: false },
    });
  }
  async getCourtSchedule(
    courtId: number,
    from: Date,
    to: Date,
  ): Promise<any[]> {
    return await this.prisma.booking.findMany({
      where: {
        courtId,
        status: { not: 'Cancelled' },
        startTime: { lt: to },
        endTime: { gt: from },
      },
      orderBy: { startTime: 'asc' },
    });
  }
}
