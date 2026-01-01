// src/services/court.service.ts
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Court, Role } from '@prisma/client';
import { CourtScheduleQueryDto } from 'src/dto/court/court-schedule-query.dto';
import { CourtBusinessHourDto, CreateCourtDto } from 'src/dto/court/create-court.dto';
import { QueryCourtDto } from 'src/dto/court/query-court.dto';
import { CourtRepository } from 'src/repositories/court.repositories';
import { toMinutes } from 'src/commons/convert-hour.common';

@Injectable()
export class CourtService {
  constructor(private readonly courtRepository: CourtRepository) {}

  async createCourt(data: CreateCourtDto, userId: number): Promise<Court> {
    try {
      const {defaultOpenTime , defaultCloseTime} = data;
      if (defaultOpenTime && defaultCloseTime) {
        if(toMinutes(defaultOpenTime) >= toMinutes(defaultCloseTime)) {
          throw new BadRequestException('Thời gian mở cửa phải trước thời gian đóng cửa');
        }
      }
      return await this.courtRepository.create({
        ...data,
        ownerId: userId,
      });
    } catch (error) {
     if (error instanceof HttpException) throw error;

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
  async createBusinessHours(
  courtId: number,
  data: CourtBusinessHourDto,
  userId: number,
) {
  try {
    const ok = await this.courtRepository.checkPermission(courtId, userId);
    if (!ok) {
      throw new ForbiddenException('Bạn không có quyền tạo giờ hoạt động cho sân này');
    }

    const { openTime, closeTime, isClosed } = data;

    if (isClosed) {
     
    } else {
      if (!openTime || !closeTime) {
        throw new BadRequestException('Vui lòng nhập openTime và closeTime');
      }
      if (toMinutes(openTime) >= toMinutes(closeTime)) {
        throw new BadRequestException('Giờ mở cửa phải trước giờ đóng cửa');
      }
    }

    const result = await this.courtRepository.createBusinessHours(courtId, data);
    return result; 
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throw new InternalServerErrorException('Đã có lỗi xảy ra khi tạo giờ hoạt động');
  }
}
async updateBusinessHours(
  courtId: number,
  dayOfWeek: number,
  data: CourtBusinessHourDto,
  userId: number,
) {
  try {
    const ok = await this.courtRepository.checkPermission(courtId, userId);
    if (!ok) {
      throw new ForbiddenException('Bạn không có quyền cập nhật giờ hoạt động cho sân này');
    }

    const result = await this.courtRepository.updateBusinessHours(courtId, dayOfWeek, data);
    return result; 
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throw new InternalServerErrorException('Đã có lỗi xảy ra khi cập nhật giờ hoạt động');
  }
}
async deleteBusinessHours(
  courtId: number,
  dayOfWeek: number,
  userId: number,
) {
  try {
    const ok = await this.courtRepository.checkPermission(courtId, userId);
    if (!ok) {
      throw new ForbiddenException('Bạn không có quyền xóa giờ hoạt động cho sân này');
    }

    const result = await this.courtRepository.deleteBusinessHours(courtId, dayOfWeek);
    return result; 
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throw new InternalServerErrorException('Đã có lỗi xảy ra khi xóa giờ hoạt động');
  }}
}
