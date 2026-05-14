import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Product, ProductDocument } from './product.schema'

@Injectable()
export class ProductsService {
	constructor(
		@InjectModel(Product.name) private productModel: Model<ProductDocument>,
	) {}

	async create(data: any): Promise<Product> {
		const last = await this.productModel.findOne().sort('-productId')
		const productId = last && last.productId ? last.productId + 1 : 1
		const created = new this.productModel({ ...data, productId })
		return created.save()
	}

	async findAll(): Promise<Product[]> {
		return this.productModel.find().exec()
	}

	async search(name?: string, category?: string): Promise<Product[]> {
		const filter: any = {}
		if (name) {
			filter.name = { $regex: name, $options: 'i' }
		}
		if (category) {
			filter.category = category
		}
		return this.productModel.find(filter).exec()
	}

	async findOne(productId: number): Promise<Product> {
		const item = await this.productModel.findOne({ productId }).exec()
		if (!item) throw new NotFoundException()
		return item
	}

	async update(productId: number, data: any): Promise<Product> {
		const updated = await this.productModel
			.findOneAndUpdate({ productId }, data, { new: true })
			.exec()
		if (!updated) throw new NotFoundException()
		return updated
	}

	async remove(productId: number): Promise<any> {
		const deleted = await this.productModel
			.findOneAndDelete({ productId })
			.exec()
		if (!deleted) throw new NotFoundException()
		return deleted
	}
}
