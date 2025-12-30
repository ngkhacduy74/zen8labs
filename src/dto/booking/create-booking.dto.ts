import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { BookingType } from '@prisma/client';
import { IsAfter } from 'src/decorators/isAfter.decorator';

export class CreateBookingDto {
  @IsInt()
  @IsNotEmpty()
  courtId: number;

  @IsISO8601()
  @IsNotEmpty()
  startTime: string;

  @IsISO8601()
  @IsNotEmpty()
  @IsAfter('startTime', { message: 'endTime phải lớn hơn startTime' })
  endTime: string;

  @IsEnum(BookingType)
  @IsOptional()
  type?: BookingType = 'Casual';

  @IsString()
  @IsOptional()
  notes?: string;
}
