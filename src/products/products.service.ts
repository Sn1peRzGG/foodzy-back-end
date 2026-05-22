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
import * as mongoose from 'mongoose'
import { extname, join } from 'path'
import { CreateProductDto } from './dto/create.dto'
import { UpdateProductDto } from './dto/update.dto'
import { Product, ProductDocument } from './product.schema'

@Injectable()
export class ProductsService {
	constructor(
		@InjectModel(Product.name)
		private readonly productModel: mongoose.Model<ProductDocument>,
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
		} catch (error) {
			void error
		}
	}

	async create(dto: CreateProductDto, file: Express.Multer.File) {
		const existing = await this.productModel.findOne({
			name: dto.name,
		})

		if (existing) {
			throw new ConflictException({
				message: 'Product already exists',
				errors: {
					name: ['Product with this name already exists'],
				},
			})
		}

		const last = await this.productModel.findOne().sort({ productId: -1 })
		const productId = last?.productId ? last.productId + 1 : 1

		let imageUrl = ''

		try {
			imageUrl = await this.saveFile(file)

			const productData = {
				...dto,
				category: new mongoose.Types.ObjectId(dto.category),
				productId,
				imageUrl,
			}

			const createdProduct = new this.productModel(productData)
			await createdProduct.save()

			return await createdProduct.populate('category')
		} catch {
			if (imageUrl) {
				await this.deleteFile(imageUrl)
			}

			throw new InternalServerErrorException({
				message: 'Failed to create product',
			})
		}
	}

	async findAll() {
		return this.productModel
			.find()
			.populate('category')
			.sort({ productId: 1 })
			.lean()
	}

	async search(name?: string, category?: string) {
		const filter: any = {}

		if (name) {
			filter.name = {
				$regex: name,
				$options: 'i',
			}
		}

		if (category && mongoose.Types.ObjectId.isValid(category)) {
			filter.category = new mongoose.Types.ObjectId(category)
		}

		return this.productModel
			.find(filter)
			.populate('category')
			.sort({ productId: 1 })
			.lean()
	}

	async findOne(productId: number) {
		const product = await this.productModel
			.findOne({ productId })
			.populate('category')
			.lean()

		if (!product) {
			throw new NotFoundException({
				message: 'Product not found',
			})
		}

		return product
	}

	async update(
		productId: number,
		dto: UpdateProductDto,
		file?: Express.Multer.File,
	) {
		const current = await this.productModel.findOne({
			productId,
		})

		if (!current) {
			throw new NotFoundException({
				message: 'Product not found',
			})
		}

		if (dto.name && dto.name !== current.name) {
			const existing = await this.productModel.findOne({
				name: dto.name,
			})

			if (existing) {
				throw new ConflictException({
					message: 'Product already exists',
					errors: {
						name: ['Product with this name already exists'],
					},
				})
			}
		}

		let imageUrl = current.imageUrl

		try {
			if (file) {
				imageUrl = await this.saveFile(file)
			}

			const updateData: mongoose.UpdateQuery<ProductDocument> = {
				...dto,
				imageUrl,
			}

			if (dto.category) {
				updateData.category = new mongoose.Types.ObjectId(dto.category)
			}

			const updated = await this.productModel
				.findOneAndUpdate({ productId }, updateData, {
					returnDocument: 'after',
				})
				.populate('category')

			if (file && current.imageUrl) {
				await this.deleteFile(current.imageUrl)
			}

			return updated
		} catch {
			if (file && imageUrl !== current.imageUrl) {
				await this.deleteFile(imageUrl)
			}

			throw new InternalServerErrorException({
				message: 'Failed to update product',
			})
		}
	}

	async remove(productId: number) {
		const product = await this.productModel.findOneAndDelete({
			productId,
		})

		if (!product) {
			throw new NotFoundException({
				message: 'Product not found',
			})
		}

		if (product.imageUrl) {
			await this.deleteFile(product.imageUrl)
		}

		return {
			success: true,
			message: 'Product deleted successfully',
		}
	}
}
