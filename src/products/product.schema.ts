import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type ProductDocument = Product & Document

@Schema()
export class Product {
	@Prop({ unique: true })
	productId!: number

	@Prop({ required: true })
	name!: string

	@Prop()
	description!: string

	@Prop()
	imageUrl!: string

	@Prop()
	category!: string

	@Prop({ required: true })
	price!: number

	@Prop()
	oldPrice!: number

	@Prop({ default: 0 })
	rating!: number
}

export const ProductSchema = SchemaFactory.createForClass(Product)
