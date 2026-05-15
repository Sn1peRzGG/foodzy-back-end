import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type UserDocument = User & Document

@Schema({ _id: false })
class CartItem {
	@Prop({
		required: true,
		min: 1,
	})
	productId!: number

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
		unique: true,
		required: true,
	})
	userId!: number

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
		type: [Number],
		default: [],
	})
	wishlist!: number[]
}

export const UserSchema = SchemaFactory.createForClass(User)
