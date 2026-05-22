import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { multerImageOptions } from '../common/config/multer.config'
import { CreateUserDto } from './dto/create.dto'
import { UpdateUserDto } from './dto/update.dto'
import { UsersService } from './users.service'

interface AuthenticatedRequest extends Request {
	user: {
		userId: number
		role: string
	}
}

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	create(
		@Body() dto: CreateUserDto,
		@UploadedFile() file: Express.Multer.File,
	) {
		if (!file) {
			throw new BadRequestException({
				message: 'Validation failed',
				errors: {
					file: ['Image is required'],
				},
			})
		}
		return this.usersService.create(dto, file)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Get()
	findAll() {
		return this.usersService.findAll()
	}

	@UseGuards(JwtAuthGuard)
	@Get(':id')
	findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
		const targetId = Number(id)

		if (req.user.role !== 'ADMIN' && req.user.userId !== targetId) {
			throw new ForbiddenException({
				message: 'Access denied',
			})
		}

		return this.usersService.findOne(targetId)
	}

	@UseGuards(JwtAuthGuard)
	@Patch(':id')
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	update(
		@Param('id') id: string,
		@Body() dto: UpdateUserDto,
		@Req() req: AuthenticatedRequest,
		@UploadedFile() file?: Express.Multer.File,
	) {
		const targetId = Number(id)

		if (req.user.role !== 'ADMIN' && req.user.userId !== targetId) {
			throw new ForbiddenException({
				message: 'Access denied',
			})
		}

		if (req.user.role !== 'ADMIN') {
			delete (dto as any).role
		}

		return this.usersService.update(targetId, dto, file)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.usersService.remove(+id)
	}
}
