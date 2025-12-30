import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterDto } from 'src/dto/user/register.dto';

import * as bcrypt from 'bcrypt';
import { UserRepository } from 'src/repositories/user.repositories';
import { LoginDto } from 'src/dto/user/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<any> {
    const { email, phone, fullname, password } = registerDto;
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email này đã tồn tại trong hệ thống');
    }

    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = await this.userRepository.create({
        email,
        fullname,
        password: hashedPassword,
        phone,
      });

      const { password: _, ...result } = newUser;

      return result;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Đã có lỗi xảy ra trong quá trình đăng ký',
      );
    }
  }
  async login(data: LoginDto): Promise<any> {
    const { email, password } = data;
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new ConflictException('Email không tồn tại trong hệ thống');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ConflictException('Mật khẩu không đúng');
    }
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  }
}
