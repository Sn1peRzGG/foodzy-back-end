import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'
import { UpdateOrderAddressDto } from './dto/update-order-address.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Post()
	async createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
		const userId = req.user._id
		return this.ordersService.create(createOrderDto, userId)
	}

	@Get('my')
	async getMyOrders(@Req() req: any) {
		const userId = req.user._id
		return this.ordersService.getUserOrders(userId)
	}

	@Get()
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	async getAllOrders() {
		return this.ordersService.getAllOrders()
	}

	@Patch(':id/status')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	async updateStatus(
		@Param('id') id: string,
		@Body() updateOrderStatusDto: UpdateOrderStatusDto,
	) {
		return this.ordersService.updateStatus(id, updateOrderStatusDto)
	}

	@Patch(':id/address')
	async updateAddress(
		@Param('id') id: string,
		@Req() req: any,
		@Body() updateOrderAddressDto: UpdateOrderAddressDto,
	) {
		const userId = req.user._id
		return this.ordersService.updateAddress(id, userId, updateOrderAddressDto)
	}

	@Patch(':id/cancel')
	async cancelOrder(@Param('id') id: string, @Req() req: any) {
		const userId = req.user._id
		return this.ordersService.cancelOrder(id, userId)
	}

	@Delete(':id')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	async deleteOrder(@Param('id') id: string) {
		return this.ordersService.deleteOrder(id)
	}
}
