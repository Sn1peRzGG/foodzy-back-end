import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	Query,
	UseGuards,
} from '@nestjs/common'
import { ProductsService } from './products.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Post()
	create(@Body() createProductDto: any) {
		return this.productsService.create(createProductDto)
	}

	@Get('search')
	search(@Query('name') name?: string, @Query('category') category?: string) {
		return this.productsService.search(name, category)
	}

	@Get()
	findAll() {
		return this.productsService.findAll()
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.productsService.findOne(+id)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Patch(':id')
	update(@Param('id') id: string, @Body() updateProductDto: any) {
		return this.productsService.update(+id, updateProductDto)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.productsService.remove(+id)
	}
}
