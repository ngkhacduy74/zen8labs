import { Module } from '@nestjs/common';
import { UserModule } from './user.module';
import { PrismaModule } from './prisma.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { CourtModule } from './court.module';
import { BookingModule } from './booking.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    PrismaModule,
    CourtModule,
    BookingModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 5,
      },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
