import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create.dto'
import { UpdateCategoryDto } from './dto/update.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('categories')
export class CategoriesController {
	constructor(private readonly categoriesService: CategoriesService) {}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(
		FileInterceptor('file', {
			storage: memoryStorage(),
			limits: {
				fileSize: 2 * 1024 * 1024,
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
	create(
		@Body() dto: CreateCategoryDto,
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

		return this.categoriesService.create(dto, file)
	}

	@Get()
	findAll() {
		return this.categoriesService.findAll()
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.categoriesService.findOne(+id)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Patch(':id')
	@UseInterceptors(
		FileInterceptor('file', {
			storage: memoryStorage(),
			limits: {
				fileSize: 2 * 1024 * 1024,
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
		@Body() dto: UpdateCategoryDto,
		@UploadedFile() file?: Express.Multer.File,
	) {
		return this.categoriesService.update(+id, dto, file)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.categoriesService.remove(+id)
	}
}
