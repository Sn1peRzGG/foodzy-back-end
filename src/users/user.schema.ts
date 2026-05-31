import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type UserDocument = User & Document

@Schema({ _id: false })
class CartItem {
	@Prop({
		type: String,
		ref: 'Product',
		required: true,
	})
	product!: string

	@Prop({
		required: true,
		min: 1,
		default: 1,
	})
	quantity!: number
}

const CartItemSchema = SchemaFactory.createForClass(CartItem)

@Schema({
	timestamps: true,
	versionKey: false,
})
export class User {
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

	@Prop({
		required: true,
		select: false,
	})
	password!: string

	@Prop({
		required: true,
		trim: true,
	})
	firstName!: string

	@Prop({
		required: true,
		trim: true,
	})
	lastName!: string

	@Prop({
		required: true,
		unique: true,
	})
	phoneNumber!: string

	@Prop({
		default: '',
	})
	city!: string

	@Prop({
		default: '',
	})
	address!: string

	@Prop({
		enum: ['USER', 'ADMIN'],
		default: 'USER',
	})
	role!: string

	@Prop({
		default: '',
	})
	avatarUrl!: string

	@Prop({
		type: [CartItemSchema],
		default: [],
	})
	cart!: CartItem[]

	@Prop({
		type: [{ type: String, ref: 'Product' }],
		default: [],
	})
	wishlist!: string[]
}

export const UserSchema = SchemaFactory.createForClass(User)
