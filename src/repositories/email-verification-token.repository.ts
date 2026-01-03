import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';

@Injectable()
export class EmailVerificationTokenRepository {
  constructor(private prisma: PrismaService) {}

  create(userId: number, tokenHash: string, expiresAt: Date) {
    return this.prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  findByTokenHash(tokenHash: string) {
    return this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
  }

  deleteById(id: number) {
    return this.prisma.emailVerificationToken.delete({ where: { id } });
  }

  deleteManyByUserId(userId: number) {
    return this.prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });
  }
}
