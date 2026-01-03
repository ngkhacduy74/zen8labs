import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CourtBusinessHourDto, CreateCourtDto } from 'src/dto/court/create-court.dto';
import { QueryCourtDto } from 'src/dto/court/query-court.dto';
import { CourtService } from 'src/services/court.service';
import { AuthGuard } from 'src/guards/token.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from '@prisma/client';
import { User } from 'src/decorators/user.decorator';
import { CourtScheduleQueryDto } from 'src/dto/court/court-schedule-query.dto';
import { QueryCourtStatsDto } from 'src/dto/court/stats-query.dto';

@Controller('courts')
export class CourtController {
  constructor(private readonly courtService: CourtService) {}
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Master)
  @Post()
  async create(@Body() data: CreateCourtDto, @User('sub') user_id: number) {
    const result = await this.courtService.createCourt(data, user_id);
    return { message: 'Tạo sân thành công', data: result };
  }

  @UseGuards(AuthGuard,RolesGuard)
  @Roles(Role.Admin, Role.Master)
  @Post(":id/business-hours")
  async createBusinessHours(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CourtBusinessHourDto,
    @User('sub') user_id: number
  ) {
    const result = await this.courtService.createBusinessHours(id, data, user_id);
    return { message: 'Tạo giờ hoạt động cho sân thành công', data: result };
  }

  @UseGuards(AuthGuard,RolesGuard)
  @Roles(Role.Admin, Role.Master)
  @Patch(":id/business-hours/:dayOfWeek")
  async updateBusinessHours(
    @Param('id', ParseIntPipe) id: number,
    @Param('dayOfWeek',ParseIntPipe) dayOfWeek: number,
    @Body() data: CourtBusinessHourDto,
    @User('sub') user_id: number
  ) {
    const result = await this.courtService.updateBusinessHours(id, dayOfWeek, data, user_id);
    return { message: 'Cập nhật giờ cho sân theo ngày trong tuần thành công', data: result };
  }
  @UseGuards(AuthGuard,RolesGuard)
  @Roles(Role.Admin, Role.Master)
  @Delete(":id/business-hours/:dayOfWeek")
  async deleteBusinessHours(
    @Param('id', ParseIntPipe) id: number,
    @Param('dayOfWeek',ParseIntPipe) dayOfWeek: number,
    @User('sub') user_id: number
  ) {
    const result = await this.courtService.deleteBusinessHours(id, dayOfWeek, user_id);
    return { message: 'Xóa giờ cho sân theo ngày trong tuần thành công', data: result };
  }
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.User, Role.Master)
  @Get()
  async findAll(
    @Query() query: QueryCourtDto,
    @User('role') role: string,
    @User('sub') user_id: number,
  ) {
    const result = await this.courtService.getAllCourts(query, role, user_id);
    return { message: 'Lấy danh sách sân thành công', data: result };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Master)
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @User('sub') user_id: number,
    @User('role') role: string,
  ) {
    const result = await this.courtService.getCourtById(id, user_id, role);
    return { message: 'Lấy thông tin sân thành công', data: result };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Master)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourtDto: Partial<CreateCourtDto>,
    @User('sub') userId: number,
    @User('role') role: string,
  ) {
    const result = await this.courtService.updateCourt(
      id,
      updateCourtDto,
      userId,
      role,
    );
    return { message: 'Cập nhật sân thành công', data: result };
  }
@UseGuards(AuthGuard,RolesGuard)
@Roles(Role.Admin, Role.Master)
@Get(':id/statistics')
async courtStats(@Param('id', ParseIntPipe) id: number, @Query() query: QueryCourtStatsDto) {
  const result = await this.courtService.getCourtStats(id, query);
  return { message: 'Lấy thống kê sân thành công', data: result };
}


  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Master)
  @Patch(':id/delete')
  async remove(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const result = await this.courtService.softDelete(id, body);
    return { message: 'Xóa sân thành công', data: result };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Master, Role.User)
  @Get(':id/schedule')
  async schedule(
    @Param('id', ParseIntPipe) courtId: number,
    @Query() query: CourtScheduleQueryDto,
  ) {
    const result = await this.courtService.getCourtSchedule(courtId, query);
    return { message: 'Lấy lịch sân thành công', data: result };
  }

  
}
