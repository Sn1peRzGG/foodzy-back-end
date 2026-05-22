import {
	BadRequestException,
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Category, CategoryDocument } from './category.schema'
import * as fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import { extname, join } from 'path'
import { randomUUID } from 'crypto'
import { CreateCategoryDto } from './dto/create.dto'
import { UpdateCategoryDto } from './dto/update.dto'

@Injectable()
export class CategoriesService {
	constructor(
		@InjectModel(Category.name)
		private readonly categoryModel: Model<CategoryDocument>,
	) {}

	private readonly uploadPath = join(process.cwd(), 'public', 'categories')

	private async saveFile(file: Express.Multer.File) {
		if (!existsSync(this.uploadPath)) {
			mkdirSync(this.uploadPath, { recursive: true })
		}

		const filename = `${randomUUID()}${extname(file.originalname)}`
		const filepath = join(this.uploadPath, filename)

		await fs.writeFile(filepath, file.buffer)

		return `/categories/${filename}`
	}

	private async deleteFile(path: string) {
		try {
			const relativePath = path.replace(/^\/+/, '')

			const fullPath = join(process.cwd(), 'public', relativePath)

			await fs.unlink(fullPath)
		} catch {}
	}

	async create(dto: CreateCategoryDto, file: Express.Multer.File) {
		const existing = await this.categoryModel.findOne({
			name: dto.name,
		})

		if (existing) {
			throw new ConflictException({
				message: 'Category already exists',
				errors: {
					name: ['Category with this name already exists'],
				},
			})
		}

		const last = await this.categoryModel.findOne().sort({ categoryId: -1 })

		const categoryId = last?.categoryId ? last.categoryId + 1 : 1

		let imageUrl = ''

		try {
			imageUrl = await this.saveFile(file)

			const category = await this.categoryModel.create({
				...dto,
				categoryId,
				imageUrl,
			})

			return category
		} catch (error) {
			if (imageUrl) {
				await this.deleteFile(imageUrl)
			}

			throw new InternalServerErrorException({
				message: 'Failed to create category',
			})
		}
	}

	async findAll() {
		return this.categoryModel.find().sort({ categoryId: 1 }).lean()
	}

	async findOne(categoryId: number) {
		const category = await this.categoryModel.findOne({ categoryId }).lean()

		if (!category) {
			throw new NotFoundException({
				message: 'Category not found',
			})
		}

		return category
	}

	async update(
		categoryId: number,
		dto: UpdateCategoryDto,
		file?: Express.Multer.File,
	) {
		const current = await this.categoryModel.findOne({
			categoryId,
		})

		if (!current) {
			throw new NotFoundException({
				message: 'Category not found',
			})
		}

		if (dto.name && dto.name !== current.name) {
			const existing = await this.categoryModel.findOne({
				name: dto.name,
			})

			if (existing) {
				throw new ConflictException({
					message: 'Category already exists',
					errors: {
						name: ['Category with this name already exists'],
					},
				})
			}
		}

		let imageUrl = current.imageUrl

		try {
			if (file) {
				imageUrl = await this.saveFile(file)
			}

			const updated = await this.categoryModel.findOneAndUpdate(
				{ categoryId },
				{
					...dto,
					imageUrl,
				},
				{
					returnDocument: 'after',
				},
			)

			if (file && current.imageUrl) {
				await this.deleteFile(current.imageUrl)
			}

			return updated
		} catch {
			if (file && imageUrl !== current.imageUrl) {
				await this.deleteFile(imageUrl)
			}

			throw new InternalServerErrorException({
				message: 'Failed to update category',
			})
		}
	}

	async remove(categoryId: number) {
		const category = await this.categoryModel.findOneAndDelete({
			categoryId,
		})

		if (!category) {
			throw new NotFoundException({
				message: 'Category not found',
			})
		}

		if (category.imageUrl) {
			await this.deleteFile(category.imageUrl)
		}

		return {
			success: true,
			message: 'Category deleted successfully',
		}
	}
}
