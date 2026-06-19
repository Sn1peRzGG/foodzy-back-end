import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type SubscriberDocument = Subscriber & Document

@Schema({
	timestamps: true,
	versionKey: false,
})
export class Subscriber {
	@Prop({
		type: String,
		default: () => randomUUID(),
	})
	_id!: string

	@Prop({
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
	})
	email!: string
}

export const SubscriberSchema = SchemaFactory.createForClass(Subscriber)
