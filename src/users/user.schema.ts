import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type UserDocument = User & Document

@Schema({ _id: false })
class CartItem {
	@Prop({ required: true })
	productId!: number

	@Prop({ required: true, min: 1, default: 1 })
	quantity!: number
}

const CartItemSchema = SchemaFactory.createForClass(CartItem)

@Schema()
export class User {
	@Prop({ unique: true })
	userId!: number

	@Prop({ required: true, unique: true })
	email!: string

	@Prop({ required: true })
	password!: string

	@Prop({ required: true })
	firstName!: string

	@Prop()
	lastName!: string

	@Prop({ unique: true, required: true })
	phoneNumber!: string

	@Prop()
	city!: string

	@Prop()
	address!: string

	@Prop({ default: 'USER', enum: ['USER', 'ADMIN'] })
	role!: string

	@Prop()
	avatarUrl!: string

	@Prop({ type: [CartItemSchema], default: [] })
	cart!: CartItem[]

	@Prop({ type: [Number], default: [] })
	wishlist!: number[]
}

export const UserSchema = SchemaFactory.createForClass(User)
