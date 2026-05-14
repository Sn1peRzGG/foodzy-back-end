import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
	Req,
	ForbiddenException,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	create(@Body() createUserDto: any) {
		return this.usersService.create(createUserDto)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Get()
	findAll() {
		return this.usersService.findAll()
	}

	@UseGuards(JwtAuthGuard)
	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.usersService.findOne(+id)
	}

	@UseGuards(JwtAuthGuard)
	@Patch(':id')
	update(@Param('id') id: string, @Body() updateUserDto: any, @Req() req: any) {
		const targetId = parseInt(id, 10)
		if (req.user.role !== 'ADMIN' && req.user.userId !== targetId) {
			throw new ForbiddenException()
		}
		return this.usersService.update(targetId, updateUserDto)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.usersService.remove(+id)
	}
}
