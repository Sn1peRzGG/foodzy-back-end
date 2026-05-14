import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type CategoryDocument = Category & Document

@Schema()
export class Category {
	@Prop({ unique: true })
	categoryId!: number

	@Prop({ required: true })
	name!: string

	@Prop()
	imageUrl!: string

	@Prop({ default: 0 })
	count!: number
}

export const CategorySchema = SchemaFactory.createForClass(Category)
