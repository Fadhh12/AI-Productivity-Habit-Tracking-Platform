import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  countActive(userId: string) {
    return this.prisma.category.count({ where: { userId, active: true } });
  }

  findAll(userId: string) {
    return this.prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  }

  findById(userId: string, id: string) {
    return this.prisma.category.findFirst({ where: { id, userId } });
  }

  create(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { userId, name: dto.name, color: dto.color ?? '#6B7280' },
    });
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
