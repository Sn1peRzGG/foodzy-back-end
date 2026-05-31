import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync } from 'fs'
import * as fs from 'fs/promises'
import { Model } from 'mongoose'
import { extname, join } from 'path'
import { CreateProductDto } from './dto/create.dto'
import { UpdateProductDto } from './dto/update.dto'
import { Product, ProductDocument } from './product.schema'

@Injectable()
export class ProductsService {
	constructor(
		@InjectModel(Product.name)
		private readonly productModel: Model<ProductDocument>,
	) {}

	private readonly uploadPath = join(process.cwd(), 'public', 'products')

	private async saveFile(file: Express.Multer.File): Promise<string> {
		if (!existsSync(this.uploadPath)) {
			mkdirSync(this.uploadPath, { recursive: true })
		}
		const filename = `${randomUUID()}${extname(file.originalname)}`
		const filepath = join(this.uploadPath, filename)
		await fs.writeFile(filepath, file.buffer)
		return `/products/${filename}`
	}

	private async deleteFile(path: string): Promise<void> {
		try {
			const relativePath = path.replace(/^\/+/, '')
			const fullPath = join(process.cwd(), 'public', relativePath)
			await fs.unlink(fullPath)
		} catch {}
	}

	async create(dto: CreateProductDto, file: Express.Multer.File) {
		const existing = await this.productModel.findOne({ name: dto.name })
		if (existing) {
			throw new ConflictException({
				message: 'Product already exists',
				errors: { name: ['Product with this name already exists'] },
			})
		}

		let imageUrl = ''
		try {
			imageUrl = await this.saveFile(file)
			const product = await this.productModel.create({
				...dto,
				isAvailable: dto.isAvailable ?? true,
				imageUrl,
			})
			return await product.populate('category')
		} catch {
			if (imageUrl) await this.deleteFile(imageUrl)
			throw new InternalServerErrorException({
				message: 'Failed to create product',
			})
		}
	}

	async findAll() {
		return this.productModel
			.find()
			.populate('category')
			.sort({ createdAt: -1 })
			.lean()
	}

	async search(
		name?: string,
		category?: string,
		page: number = 1,
		limit: number = 20,
		minPrice?: number,
		maxPrice?: number,
		minRating?: number,
		isAvailable?: boolean,
		onSale?: boolean,
	) {
		const filter: any = {}

		if (name) {
			filter.name = { $regex: name, $options: 'i' }
		}

		if (category) {
			filter.category = category
		}

		if (minPrice !== undefined || maxPrice !== undefined) {
			filter.price = {}
			if (minPrice !== undefined) filter.price.$gte = minPrice
			if (maxPrice !== undefined) filter.price.$lte = maxPrice
		}

		if (minRating !== undefined) {
			filter.rating = { $gte: minRating }
		}

		if (isAvailable === true) {
			filter.isAvailable = true
		}

		if (onSale === true) {
			filter.oldPrice = { $gt: 0 }
		}

		const total = await this.productModel.countDocuments(filter)

		const data = await this.productModel
			.find(filter)
			.populate('category')
			.sort({ isAvailable: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean()

		return {
			data,
			meta: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		}
	}

	async findOne(id: string) {
		const product = await this.productModel
			.findById(id)
			.populate('category')
			.lean()
		if (!product) throw new NotFoundException({ message: 'Product not found' })
		return product
	}

	async update(id: string, dto: UpdateProductDto, file?: Express.Multer.File) {
		const current = await this.productModel.findById(id)
		if (!current) throw new NotFoundException({ message: 'Product not found' })

		if (dto.name && dto.name !== current.name) {
			const existing = await this.productModel.findOne({ name: dto.name })
			if (existing) {
				throw new ConflictException({
					message: 'Product already exists',
					errors: { name: ['Product with this name already exists'] },
				})
			}
		}

		let imageUrl = current.imageUrl
		try {
			if (file) imageUrl = await this.saveFile(file)
			const updated = await this.productModel
				.findByIdAndUpdate(
					id,
					{ ...dto, imageUrl },
					{ returnDocument: 'after' },
				)
				.populate('category')
			if (file && current.imageUrl) await this.deleteFile(current.imageUrl)
			return updated
		} catch {
			if (file && imageUrl !== current.imageUrl) await this.deleteFile(imageUrl)
			throw new InternalServerErrorException({
				message: 'Failed to update product',
			})
		}
	}

	async remove(id: string) {
		const product = await this.productModel.findByIdAndDelete(id)
		if (!product) throw new NotFoundException({ message: 'Product not found' })
		if (product.imageUrl) await this.deleteFile(product.imageUrl)
		return { success: true, message: 'Product deleted successfully' }
	}
}
