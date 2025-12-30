import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { RegisterDto } from 'src/dto/user/register.dto';
import { LoginDto } from 'src/dto/user/login.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('/register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.userService.register(registerDto);
    return { message: 'Đăng ký tài khoản thành công', data: result };
  }
  @Post('/login')
  async login(@Body() data: LoginDto) {
    const result = await this.userService.login(data);
    return { message: 'Đăng nhập thành công', accessToken: result };
  }
}
