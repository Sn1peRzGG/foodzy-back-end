import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Product, ProductSchema } from '../products/product.schema'
import { User, UserSchema } from '../users/user.schema'
import { Order, OrderSchema } from './order.schema'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Order.name, schema: OrderSchema },
			{ name: Product.name, schema: ProductSchema },
			{ name: User.name, schema: UserSchema },
		]),
	],
	controllers: [OrdersController],
	providers: [OrdersService],
})
export class OrdersModule {}
