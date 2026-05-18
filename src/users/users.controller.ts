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
import { memoryStorage } from 'multer'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { CreateUserDto } from './dto/create.dto'
import { UpdateUserDto } from './dto/update.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	create(@Body() dto: CreateUserDto) {
		return this.usersService.create(dto)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Get()
	findAll() {
		return this.usersService.findAll()
	}

	@UseGuards(JwtAuthGuard)
	@Get(':id')
	findOne(@Param('id') id: string, @Req() req: any) {
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
	@UseInterceptors(
		FileInterceptor('file', {
			storage: memoryStorage(),
			limits: {
				fileSize: 4 * 1024 * 1024,
			},
			fileFilter: (req, file, cb) => {
				const allowed = ['image/jpeg', 'image/png', 'image/webp']

				if (!allowed.includes(file.mimetype)) {
					return cb(
						new BadRequestException(
							'Only JPG, PNG and WEBP images are allowed',
						),
						false,
					)
				}

				cb(null, true)
			},
		}),
	)
	update(
		@Param('id') id: string,
		@Body() dto: UpdateUserDto,
		@Req() req: any,
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
