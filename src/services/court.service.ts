// src/services/court.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Court, Role } from '@prisma/client';
import { CourtScheduleQueryDto } from 'src/dto/court/court-schedule-query.dto';
import { CreateCourtDto } from 'src/dto/court/create-court.dto';
import { QueryCourtDto } from 'src/dto/court/query-court.dto';
import { CourtRepository } from 'src/repositories/court.repositories';

@Injectable()
export class CourtService {
  constructor(private readonly courtRepository: CourtRepository) {}

  async createCourt(data: CreateCourtDto, userId: number): Promise<Court> {
    try {
      return await this.courtRepository.create({
        ...data,
        ownerId: userId,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Đã có lỗi xảy ra trong quá trình tạo sân',
      );
    }
  }

  async getCourtById(id: number, userId: number, role: string) {
    let ownerId: number | undefined;
    let activeOnly = false;

    if (role === Role.Master) {
      ownerId = userId;
    } else if (role === Role.User) {
      activeOnly = true;
    }

    const court = await this.courtRepository.findById(id, ownerId, activeOnly);
    if (!court)
      throw new NotFoundException('Không tìm thấy sân hoặc sân đã bị ẩn');

    return court;
  }

  async getAllCourts(query: QueryCourtDto, role: string, userId: number) {
    let ownerId: number | undefined;
    let activeOnly = false;

    if (role === Role.Master) {
      ownerId = userId;
    } else if (role === Role.User) {
      activeOnly = true;
    }
    return await this.courtRepository.findAll(query, ownerId, activeOnly);
  }
  async softDelete(id: number, body: any): Promise<any> {
    try {
      const deletedCourt = await this.courtRepository.softDelete(id, body);
      if (!deletedCourt) {
        throw new NotFoundException('Không tìm thấy sân để xóa');
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'Đã có lỗi xảy ra trong quá trình xóa sân',
      );
    }
  }
  async updateCourt(
    id: number,
    data: Partial<CreateCourtDto>,
    userId: number,
    role: string,
  ) {
    const ownerId = role === Role.Admin ? undefined : userId;

    const updatedCourt = await this.courtRepository.update(id, data, ownerId);
    if (!updatedCourt) {
      throw new NotFoundException(
        'Không tìm thấy sân hoặc bạn không có quyền chỉnh sửa',
      );
    }

    return updatedCourt;
  }

  async getCourtSchedule(
    courtId: number,
    query: CourtScheduleQueryDto,
  ): Promise<any> {
    const fromDate = new Date(query.from);
    const toDate = new Date(query.to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('Thời gian from/to không hợp lệ');
    }
    if (toDate <= fromDate) {
      throw new BadRequestException(
        'Thời gian kết thúc phải lớn hơn thời gian bắt đầu',
      );
    }

    const court = await this.courtRepository.findById(courtId, undefined, true);
    if (!court)
      throw new NotFoundException('Không tìm thấy sân đang hoạt động');

    const bookings = await this.courtRepository.getCourtSchedule(
      courtId,
      fromDate,
      toDate,
    );

    return {
      courtId,
      courtName: court.name,
      status: bookings.length > 0 ? 'occupied' : 'free',
      bookings,
    };
  }
}
