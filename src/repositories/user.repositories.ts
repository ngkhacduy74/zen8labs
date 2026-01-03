import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { User } from '../../generated/prisma/client';
import { RegisterDto } from 'src/dto/user/register.dto';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.prisma.user.findUnique({
      where: { email },
    });
    return result;
  }

  async create(data: RegisterDto): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }
  async updateVerified(userId: number) {
  return this.prisma.user.update({
    where: { id: userId },
    data: { isVerified: true }, 
  });
}

}
