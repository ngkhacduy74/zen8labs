import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterDto } from 'src/dto/user/register.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserRepository } from 'src/repositories/user.repositories';
import { LoginDto } from 'src/dto/user/login.dto';
import { JwtService } from '@nestjs/jwt';
import { EmailVerificationTokenRepository } from 'src/repositories/email-verification-token.repository';
import { MailService } from './email.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: EmailVerificationTokenRepository,
    private readonly mailService: MailService,
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

      
       const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = await this.sha256(rawToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
     const linkToken = await this.tokenRepository.create(newUser.id, tokenHash, expiresAt);
     const verifyLink = `${process.env.BACKEND_URL}/users/verify-email?token=${rawToken}`;
      await this.mailService.sendVerifyEmail(email, verifyLink);
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
  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('Thiếu token');

    const tokenHash = await this.sha256(token);
    const record = await this.tokenRepository.findByTokenHash(tokenHash);

    if (!record) throw new BadRequestException('Token không hợp lệ');

    if (record.expiresAt < new Date()) {
      await this.tokenRepository.deleteById(record.id);
      throw new BadRequestException('Token đã hết hạn');
    }

    await this.userRepository.updateVerified(record.userId);
    await this.tokenRepository.deleteById(record.id);

    return true;
  }
private sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
}
