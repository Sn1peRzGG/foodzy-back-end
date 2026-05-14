import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
} from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('categories')
export class CategoriesController {
	constructor(private readonly categoriesService: CategoriesService) {}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Post()
	create(@Body() createCategoryDto: any) {
		return this.categoriesService.create(createCategoryDto)
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
	update(@Param('id') id: string, @Body() updateCategoryDto: any) {
		return this.categoriesService.update(+id, updateCategoryDto)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.categoriesService.remove(+id)
	}
}
