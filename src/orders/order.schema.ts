import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type OrderDocument = Order & Document

export enum OrderStatus {
	PENDING = 'PENDING',
	PROCESSING = 'PROCESSING',
	SHIPPED = 'SHIPPED',
	DELIVERED = 'DELIVERED',
	CANCELLED = 'CANCELLED',
}

@Schema({ _id: false })
class OrderItem {
	@Prop({
		type: String,
		ref: 'Product',
		required: true,
	})
	product!: string

	@Prop({
		required: true,
		min: 1,
	})
	quantity!: number

	@Prop({
		required: true,
		min: 0,
	})
	priceAtPurchase!: number
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem)

@Schema({
	timestamps: true,
	versionKey: false,
})
export class Order {
	@Prop({
		type: String,
		default: () => randomUUID(),
	})
	_id!: string

	@Prop({
		type: String,
		ref: 'User',
		required: true,
	})
	user!: string

	@Prop({
		type: [OrderItemSchema],
		required: true,
	})
	items!: OrderItem[]

	@Prop({
		required: true,
		min: 0,
	})
	totalPrice!: number

	@Prop({
		type: String,
		enum: Object.values(OrderStatus),
		default: OrderStatus.PENDING,
	})
	status!: OrderStatus

	@Prop({ required: true })
	deliveryAddress!: string

	@Prop({ required: true })
	phoneNumber!: string
}

export const OrderSchema = SchemaFactory.createForClass(Order)
