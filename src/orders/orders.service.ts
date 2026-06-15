import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Product, ProductDocument } from '../products/product.schema'
import { User, UserDocument } from '../users/user.schema'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderAddressDto } from './dto/update-order-address.dto'
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'
import { Order, OrderDocument, OrderStatus } from './order.schema'

@Injectable()
export class OrdersService {
	constructor(
		@InjectModel(Order.name) private orderModel: Model<OrderDocument>,
		@InjectModel(Product.name) private productModel: Model<ProductDocument>,
		@InjectModel(User.name) private userModel: Model<UserDocument>,
	) {}

	async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
		const orderItems: {
			product: string
			quantity: number
			priceAtPurchase: number
		}[] = []
		let totalPrice = 0

		for (const item of createOrderDto.items) {
			const product = await this.productModel.findById(item.product)
			if (!product || !product.isAvailable) {
				throw new NotFoundException(
					`Product with ID ${item.product} not found or unavailable`,
				)
			}

			const itemPrice = product.price * item.quantity
			totalPrice += itemPrice

			orderItems.push({
				product: product._id,
				quantity: item.quantity,
				priceAtPurchase: product.price,
			})
		}

		const user = await this.userModel.findById(userId)
		if (!user) {
			throw new NotFoundException('User not found')
		}

		const userUpdateFields: Record<string, string> = {}
		if (!user.city) userUpdateFields.city = createOrderDto.city
		if (!user.address) userUpdateFields.address = createOrderDto.address

		if (Object.keys(userUpdateFields).length > 0) {
			await this.userModel.findByIdAndUpdate(userId, { $set: userUpdateFields })
		}

		const deliveryAddress = `${createOrderDto.city}, ${createOrderDto.address}`

		totalPrice = Number(totalPrice.toFixed(2))

		const newOrder = new this.orderModel({
			user: userId,
			items: orderItems,
			totalPrice,
			deliveryAddress,
			phoneNumber: createOrderDto.phoneNumber,
		})

		const savedOrder = await newOrder.save()
		await this.userModel.findByIdAndUpdate(userId, { $set: { cart: [] } })

		return savedOrder
	}

	async getUserOrders(userId: string): Promise<Order[]> {
		return this.orderModel
			.find({ user: userId })
			.populate('items.product')
			.sort({ createdAt: -1 })
			.exec()
	}

	async getAllOrders(): Promise<Order[]> {
		return this.orderModel
			.find()
			.populate('user')
			.populate('items.product')
			.sort({ createdAt: -1 })
			.exec()
	}

	async updateStatus(
		id: string,
		updateOrderStatusDto: UpdateOrderStatusDto,
	): Promise<Order> {
		const order = await this.orderModel.findByIdAndUpdate(
			id,
			{ $set: { status: updateOrderStatusDto.status } },
			{ returnDocument: 'after' },
		)
		if (!order) {
			throw new NotFoundException(`Order with ID ${id} not found`)
		}
		return order
	}

	async updateAddress(
		id: string,
		userId: string,
		updateOrderAddressDto: UpdateOrderAddressDto,
	): Promise<Order> {
		const order = await this.orderModel.findById(id)
		if (!order) {
			throw new NotFoundException(`Order with ID ${id} not found`)
		}

		if (order.user !== userId) {
			throw new ForbiddenException('You can only update your own orders')
		}

		if (order.status !== OrderStatus.PENDING) {
			throw new ForbiddenException(
				'Cannot update address after the order has been processed',
			)
		}

		order.deliveryAddress = updateOrderAddressDto.deliveryAddress
		return order.save()
	}

	async cancelOrder(id: string, userId: string): Promise<Order> {
		const order = await this.orderModel.findById(id)
		if (!order) {
			throw new NotFoundException(`Order with ID ${id} not found`)
		}

		if (order.user !== userId) {
			throw new ForbiddenException('You can only cancel your own orders')
		}

		if (order.status !== OrderStatus.PENDING) {
			throw new ForbiddenException(
				'Cannot cancel an order after it has been processed',
			)
		}

		order.status = OrderStatus.CANCELLED
		return order.save()
	}

	async deleteOrder(id: string): Promise<{ message: string }> {
		const order = await this.orderModel.findByIdAndDelete(id)
		if (!order) {
			throw new NotFoundException(`Order with ID ${id} not found`)
		}
		return { message: 'Order successfully deleted from database' }
	}
}
