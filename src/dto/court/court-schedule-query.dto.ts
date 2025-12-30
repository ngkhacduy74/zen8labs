import { IsISO8601, IsOptional } from 'class-validator';
import { IsAfter } from 'src/decorators/isAfter.decorator';

export class CourtScheduleQueryDto {
  @IsISO8601()
  from: string;

  @IsISO8601()
  @IsAfter('from', { message: 'Thời gian kết thúc phải lớn hơn bắt đầu' })
  to: string;
}
