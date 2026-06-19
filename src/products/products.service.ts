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
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
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
		} catch {
			// File deleted
		}
	}

	async create(dto: CreateProductDto, file: Express.Multer.File) {
		const existing = await this.productModel.findOne({
			name: dto.name,
			isDeleted: false,
		})
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
				isDeleted: false,
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
			.find({ isDeleted: false })
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
		maxRating?: number,
		isAvailable?: boolean,
		onSale?: boolean,
		sortBy?: string,
	) {
		const filter: any = { isDeleted: false }

		if (name) filter.name = { $regex: name, $options: 'i' }
		if (category) filter.category = category

		const boundsFilter = { ...filter }

		if (minPrice !== undefined || maxPrice !== undefined) {
			filter.price = {}
			if (minPrice !== undefined) filter.price.$gte = minPrice
			if (maxPrice !== undefined) filter.price.$lte = maxPrice
		}

		if (minRating !== undefined || maxRating !== undefined) {
			filter.rating = {}
			if (minRating !== undefined) filter.rating.$gte = minRating
			if (maxRating !== undefined) filter.rating.$lte = maxRating
		}

		if (isAvailable === true) filter.isAvailable = true
		if (onSale === true) filter.oldPrice = { $gt: 0 }

		const total = await this.productModel.countDocuments(filter)

		const bounds = await this.productModel.aggregate([
			{ $match: boundsFilter },
			{
				$group: {
					_id: null,
					minPrice: { $min: '$price' },
					maxPrice: { $max: '$price' },
				},
			},
		])

		const globalMinPrice =
			bounds[0]?.minPrice !== undefined && bounds[0]?.minPrice !== null
				? Math.floor(bounds[0].minPrice)
				: 0

		const globalMaxPrice =
			bounds[0]?.maxPrice !== undefined && bounds[0]?.maxPrice !== null
				? Math.ceil(bounds[0].maxPrice)
				: 100

		const globalMinRating = 0

		const globalMaxRating = 5

		const sortObject: any = { isAvailable: -1 }

		if (sortBy === 'price-asc') {
			sortObject.price = 1
		} else if (sortBy === 'price-desc') {
			sortObject.price = -1
		} else {
			sortObject.rating = -1
		}

		const data = await this.productModel
			.find(filter)
			.populate('category')
			.sort(sortObject)
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
				minPrice: globalMinPrice,
				maxPrice: globalMaxPrice,
				minRating: globalMinRating,
				maxRating: globalMaxRating,
			},
		}
	}

	async findOne(id: string) {
		const product = await this.productModel
			.findOne({ _id: id, isDeleted: false } as any)
			.populate('category')
			.lean()
		if (!product) throw new NotFoundException({ message: 'Product not found' })
		return product
	}

	async update(id: string, dto: UpdateProductDto, file?: Express.Multer.File) {
		const current = await this.productModel.findOne({
			_id: id,
			isDeleted: false,
		} as any)
		if (!current) throw new NotFoundException({ message: 'Product not found' })

		if (dto.name && dto.name !== current.name) {
			const existing = await this.productModel.findOne({
				name: dto.name,
				isDeleted: false,
			})
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
		const product = await this.productModel.findByIdAndUpdate(
			id,
			{ isDeleted: true, isAvailable: false },
			{ returnDocument: 'after' },
		)

		if (!product) throw new NotFoundException({ message: 'Product not found' })

		return { success: true, message: 'Product deleted successfully' }
	}
}
