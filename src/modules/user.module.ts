import { Module } from '@nestjs/common';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { UserRepository } from 'src/repositories/user.repositories';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { MailService } from 'src/services/email.service';
import { EmailVerificationTokenRepository } from 'src/repositories/email-verification-token.repository';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 5,
      },
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'khacduy0704',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, PrismaService,MailService,EmailVerificationTokenRepository],
})
export class UserModule {}
