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
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { multerImageOptions } from '../common/config/multer.config'
import { CreateProductDto } from './dto/create.dto'
import { UpdateProductDto } from './dto/update.dto'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	create(
		@Body() dto: CreateProductDto,
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
		return this.productsService.create(dto, file)
	}

	@Get()
	findAll() {
		return this.productsService.findAll()
	}

	@Get('search')
	search(@Query('name') name?: string, @Query('category') category?: string) {
		return this.productsService.search(name, category)
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.productsService.findOne(+id)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Patch(':id')
	@UseInterceptors(FileInterceptor('file', multerImageOptions))
	update(
		@Param('id') id: string,
		@Body() dto: UpdateProductDto,
		@UploadedFile() file?: Express.Multer.File,
	) {
		return this.productsService.update(+id, dto, file)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.productsService.remove(+id)
	}
}
