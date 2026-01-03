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
import { QueryCourtStatsDto } from 'src/dto/court/stats-query.dto';
import { DateTime } from 'luxon';
import { BookingRepository } from 'src/repositories/booking.repositories';
@Injectable()
export class CourtService {
  constructor(private readonly courtRepository: CourtRepository, private readonly bookingRepository: BookingRepository) {}

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
async getCourtStats(courtId: number, query: QueryCourtStatsDto) {
  const court = await this.courtRepository.findCourtForStats(courtId);
  if (!court) throw new NotFoundException('Không tìm thấy sân');

  const range = this.resolveStatsMonthRange(court.timezone ?? 'Asia/Ho_Chi_Minh', query);

  const bookings = await this.bookingRepository.findBookingsInRange(
    courtId,
    range.fromUTC,
    range.toUTC,
  );

  const [bookedHours, totalRevenue, availableHours, peakTime] = await Promise.all([
  Promise.resolve(this.calcBookedHours(bookings, range.fromUTC, range.toUTC)),
  Promise.resolve(this.calcTotalRevenue(bookings)),
  Promise.resolve(this.calcAvailableHours(court, range.fromLocal, range.toLocal)),
  Promise.resolve(this.calcPeakHourUtilization(bookings, range.fromLocal, range.toLocal, range.tz)), // <-- đổi ở đây
]);


  const occupancyRate = availableHours > 0 ? bookedHours / availableHours : 0;

  return {
    courtId,
    year: range.year,
    month: range.month,
    timezone: range.tz,
    bookedHours,
    availableHours,
    occupancyRate,
    totalRevenue,
    peakTime,
  };
}

  private resolveStatsMonthRange(tz: string, query: QueryCourtStatsDto) {
  const now = DateTime.now().setZone(tz);
  const year = query.year ?? now.year;
  const month = query.month ?? now.month;

  if (month < 1 || month > 12) throw new BadRequestException('month must be 1..12');

  const fromLocal = DateTime.fromObject({ year, month, day: 1, hour: 0, minute: 0 }, { zone: tz });
  if (!fromLocal.isValid) throw new BadRequestException('year/month invalid');

  const toLocal = fromLocal.plus({ months: 1 });

  return {
    year,
    month,
    tz,
    fromLocal,
    toLocal,
    fromUTC: fromLocal.toUTC().toJSDate(),
    toUTC: toLocal.toUTC().toJSDate(),
  };
}
private calcBookedHours(bookings: any[], fromUTC: Date, toUTC: Date) {
  return bookings.reduce((sum, b) => {
    const s = b.startTime > fromUTC ? b.startTime : fromUTC;
    const e = b.endTime < toUTC ? b.endTime : toUTC;
    const dur = (e.getTime() - s.getTime()) / 3600000;
    return dur > 0 ? sum + dur : sum;
  }, 0);
}
private calcTotalRevenue(bookings: any[]) {
  return bookings.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
}
private calcAvailableHours(court: any, fromLocal: any, toLocal: any) {
  if (!court.defaultOpenTime || !court.defaultCloseTime) {
    throw new BadRequestException('Sân chưa cấu hình giờ hoạt động mặc định');
  }

  const map = new Map<number, any>();
  for (const r of court.businessHours ?? []) map.set(r.dayOfWeek, r);

  let availableHours = 0;

  for (let d = fromLocal; d < toLocal; d = d.plus({ days: 1 })) {
    const dow0 = d.weekday === 7 ? 0 : d.weekday; // Sun=0
    const rule = map.get(dow0);

    if (rule?.isClosed) continue;

    const open = rule?.openTime ?? court.defaultOpenTime;
    const close = rule?.closeTime ?? court.defaultCloseTime;

    const openMin = toMinutes(open);
    const closeMin = toMinutes(close);

    if (closeMin > openMin) availableHours += (closeMin - openMin) / 60;
  }

  return availableHours;
}
private calcPeakTime(bookings: any[], tz: string) {
  const diff = Array(1441).fill(0);

  const add = (s: number, e: number) => {
    s = Math.max(0, Math.min(1440, s));
    e = Math.max(0, Math.min(1440, e));
    if (e <= s) return;
    diff[s] += 1;
    diff[e] -= 1;
  };

  for (const b of bookings) {
    const s = DateTime.fromJSDate(b.startTime, { zone: 'utc' }).setZone(tz);
    const e = DateTime.fromJSDate(b.endTime, { zone: 'utc' }).setZone(tz);

    const sMin = s.hour * 60 + s.minute;
    const eMin = e.hour * 60 + e.minute;

    if (eMin < sMin) { 
      add(sMin, 1440);
      add(0, eMin);
    } else {
      add(sMin, eMin);
    }
  }

  let cur = 0, max = 0;
  const freq = Array(1440).fill(0);
  for (let m = 0; m < 1440; m++) {
    cur += diff[m];
    freq[m] = cur;
    if (cur > max) max = cur;
  }

  const toHHmm = (min: number) =>
    `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

  const intervals: any[] = [];
  if (max > 0) {
    for (let i = 0; i < 1440; ) {
      if (freq[i] === max) {
        let j = i + 1;
        while (j < 1440 && freq[j] === max) j++;
        intervals.push({ startMin: i, endMin: j, start: toHHmm(i), end: toHHmm(j) });
        i = j;
      } else i++;
    }
  }

  return { maxFrequency: max, intervals };
}
private calcPeakHourUtilization(bookings: any[], fromLocal: any, toLocal: any, tz: string) {
  const minutesByHour = Array(24).fill(0);

  const clampMax = (a: any, b: any) => (a > b ? a : b);
  const clampMin = (a: any, b: any) => (a < b ? a : b);

  for (const b of bookings) {
    let s = DateTime.fromJSDate(b.startTime, { zone: 'utc' }).setZone(tz);
    let e = DateTime.fromJSDate(b.endTime, { zone: 'utc' }).setZone(tz);

    s = clampMax(s, fromLocal);
    e = clampMin(e, toLocal);
    if (e <= s) continue;

    while (s < e) {
      const hourStart = s.startOf('hour');         
      const nextHour = hourStart.plus({ hours: 1 }); 
      const segEnd = e < nextHour ? e : nextHour;

      const durMin = segEnd.diff(s, 'minutes').minutes;
      minutesByHour[hourStart.hour] += durMin;

      s = segEnd;
    }
  }

  const maxMinutes = Math.max(...minutesByHour);

  const toHH = (h: number) => String(h).padStart(2, '0');
  const peakHours =
    maxMinutes > 0
      ? minutesByHour
          .map((m, h) => ({
            hour: h,
            start: `${toHH(h)}:00`,
            end: `${toHH((h + 1) % 24)}:00`,
            minutes: Math.round(m),
            hours: +(m / 60).toFixed(2),
          }))
          .filter((x) => x.minutes === Math.round(maxMinutes))
      : [];

  return {
    unit: 'minutes',
    maxMinutes: Math.round(maxMinutes),
    maxHours: +(maxMinutes / 60).toFixed(2),
    peakHours,             
    minutesByHour,         
  };
}

}
