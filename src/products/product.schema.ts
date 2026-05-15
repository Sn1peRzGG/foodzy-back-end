import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

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
}

export const ProductSchema = SchemaFactory.createForClass(Product)
