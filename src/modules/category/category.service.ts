import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const MAX_ACTIVE_CATEGORIES = 20;

@Injectable()
export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  findAll(userId: string) {
    return this.repository.findAll(userId);
  }

  async findOneOrThrow(userId: string, id: string) {
    const category = await this.repository.findById(userId, id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const activeCount = await this.repository.countActive(userId);
    if (activeCount >= MAX_ACTIVE_CATEGORIES) {
      throw new BadRequestException(
        `Maximum of ${MAX_ACTIVE_CATEGORIES} active categories reached. Archive one before adding a new one.`,
      );
    }
    return this.repository.create(userId, dto);
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const existing = await this.repository.findById(userId, id);
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.active === true && !existing.active) {
      const activeCount = await this.repository.countActive(userId);
      if (activeCount >= MAX_ACTIVE_CATEGORIES) {
        throw new BadRequestException(
          `Maximum of ${MAX_ACTIVE_CATEGORIES} active categories reached.`,
        );
      }
    }

    return this.repository.update(id, dto);
  }

  async remove(userId: string, id: string) {
    const existing = await this.repository.findById(userId, id);
    if (!existing) throw new NotFoundException('Category not found');
    await this.repository.delete(id);
    return { success: true };
  }
}
