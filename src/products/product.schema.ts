import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { Category } from '../categories/category.schema'

export type ProductDocument = Product & Document

@Schema({
	timestamps: true,
	versionKey: false,
})
export class Product {
	@Prop({
		unique: true,
		required: true,
	})
	productId!: number

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
		type: MongooseSchema.Types.ObjectId,
		ref: 'Category',
		required: true,
	})
	category!: Category

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
