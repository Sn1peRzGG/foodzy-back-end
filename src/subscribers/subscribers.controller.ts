import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Delete,
	HttpCode,
	HttpStatus,
	UseGuards,
} from '@nestjs/common'
import { SubscribersService } from './subscribers.service'
import { CreateSubscriberDto } from './dto/create-subscriber.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'

@Controller('subscribers')
export class SubscribersController {
	constructor(private readonly subscribersService: SubscribersService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	create(@Body() createSubscriberDto: CreateSubscriberDto) {
		return this.subscribersService.create(createSubscriberDto)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Get()
	findAll() {
		return this.subscribersService.findAll()
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.subscribersService.remove(id)
	}
}
