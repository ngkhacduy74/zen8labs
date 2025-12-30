import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  Min,
} from 'class-validator';

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
}
