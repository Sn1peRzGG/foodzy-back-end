import { IsEnum, IsNotEmpty } from 'class-validator'
import { OrderStatus } from '../order.schema'

export class UpdateOrderStatusDto {
	@IsEnum(OrderStatus)
	@IsNotEmpty()
	status!: OrderStatus
}
