import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  Min,
  Matches,
  ValidateNested,
  IsInt,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CourtBusinessHourDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; 

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'openTime phải đúng định dạng HH:mm' })
  openTime?: string; // "06:00"

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'closeTime phải đúng định dạng HH:mm' })
  closeTime?: string; // "22:00"
}

export class CreateCourtDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên sân không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price_per_hour: number;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsOptional()
  @IsString()
  timezone?: string; 

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'defaultOpenTime phải đúng định dạng HH:mm' })
  defaultOpenTime?: string; // "06:00"

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'defaultCloseTime phải đúng định dạng HH:mm' })
  defaultCloseTime?: string; // "22:00"

//   @IsOptional()
//   @ValidateNested({ each: true })
//   @Type(() => CourtBusinessHourDto)
//   businessHours?: CourtBusinessHourDto[];
}
