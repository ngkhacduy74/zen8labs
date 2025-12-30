import {
  IsInt,
  Max,
  Min,
  IsOptional,
  IsString,
  IsISO8601,
} from 'class-validator';

export class CreateFixedBookingDto {
  @IsInt()
  courtId: number;

  @IsISO8601()
  startDate: string;
  
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek: number[];

  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number;

  @IsInt()
  @Min(1)
  @Max(12)
  durationHours: number;

  @IsInt()
  @Min(1)
  @Max(52)
  weeks: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
