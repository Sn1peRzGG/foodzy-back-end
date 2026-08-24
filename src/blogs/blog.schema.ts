import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type BlogDocument = Blog & Document

@Schema({
	timestamps: true,
	versionKey: false,
})
export class Blog {
	@Prop({
		type: String,
		default: () => randomUUID(),
	})
	_id!: string

	@Prop({
		required: true,
		trim: true,
	})
	title!: string

	@Prop({
		required: true,
		trim: true,
	})
	content!: string

	@Prop({
		type: String,
		default: '',
	})
	banner!: string

	@Prop({
		type: String,
		ref: 'User',
		required: true,
	})
	authorId!: string
}

export const BlogSchema = SchemaFactory.createForClass(Blog)
