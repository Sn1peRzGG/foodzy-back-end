import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type ProductDocument = Product & Document

@Schema({
	timestamps: true,
	versionKey: false,
})
export class Product {
	@Prop({
		type: String,
		default: () => randomUUID(),
	})
	_id!: string

	@Prop({
		required: true,
		trim: true,
	})
	name!: string

	@Prop({
		default: '',
	})
	description!: string

	@Prop({
		required: true,
	})
	imageUrl!: string

	@Prop({
		type: String,
		ref: 'Category',
		required: true,
	})
	category!: string

	@Prop({
		required: true,
		min: 0,
	})
	price!: number

	@Prop({
		min: 0,
	})
	oldPrice!: number

	@Prop({
		default: 0,
		min: 0,
		max: 5,
	})
	rating!: number

	@Prop({
		trim: true,
		default: '',
	})
	weight?: string

	@Prop({
		type: Number,
		min: 0,
		default: 0,
	})
	calories?: number

	@Prop({
		type: Boolean,
		default: true,
	})
	isAvailable!: boolean
}

export const ProductSchema = SchemaFactory.createForClass(Product)

async function updateCategoryCount(model: any, categoryId: string) {
	if (!categoryId) return

	const count = await model.countDocuments({ category: categoryId })

	await model.db.model('Category').findByIdAndUpdate(categoryId, { count })
}

ProductSchema.post('save', async function (doc) {
	const model = doc.$model(doc.constructor.name)
	await updateCategoryCount(model, doc.category)
})

ProductSchema.post('findOneAndDelete', async function (doc) {
	if (doc) {
		const model = doc.$model(doc.constructor.name)
		await updateCategoryCount(model, doc.category)
	}
})

ProductSchema.pre('findOneAndUpdate', async function (this: any) {
	this._updateDocBeforeUpdate = await this.model.findOne(this.getQuery()).lean()
})

ProductSchema.post('findOneAndUpdate', async function (this: any, doc) {
	if (doc) {
		const model = doc.$model(doc.constructor.name)

		await updateCategoryCount(model, doc.category)

		const oldCategory = this._updateDocBeforeUpdate?.category
		if (oldCategory && oldCategory !== doc.category) {
			await updateCategoryCount(model, oldCategory)
		}
	}
})
