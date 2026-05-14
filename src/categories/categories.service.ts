import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Category, CategoryDocument } from './category.schema'

@Injectable()
export class CategoriesService {
	constructor(
		@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
	) {}

	async create(data: any): Promise<Category> {
		const last = await this.categoryModel.findOne().sort('-categoryId')
		const categoryId = last && last.categoryId ? last.categoryId + 1 : 1
		const created = new this.categoryModel({ ...data, categoryId })
		return created.save()
	}

	async findAll(): Promise<Category[]> {
		return this.categoryModel.find().exec()
	}

	async findOne(categoryId: number): Promise<Category> {
		const item = await this.categoryModel.findOne({ categoryId }).exec()
		if (!item) throw new NotFoundException()
		return item
	}

	async update(categoryId: number, data: any): Promise<Category> {
		const updated = await this.categoryModel
			.findOneAndUpdate({ categoryId }, data, { new: true })
			.exec()
		if (!updated) throw new NotFoundException()
		return updated
	}

	async remove(categoryId: number): Promise<any> {
		const deleted = await this.categoryModel
			.findOneAndDelete({ categoryId })
			.exec()
		if (!deleted) throw new NotFoundException()
		return deleted
	}
}
