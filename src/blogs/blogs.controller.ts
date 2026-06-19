import {
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
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { multerImageOptions } from '../common/config/multer.config'
import { BlogsService } from './blogs.service'
import { CreateBlogDto } from './dto/create-blog.dto'
import { UpdateBlogDto } from './dto/update-blog.dto'

@Controller('blogs')
export class BlogsController {
	constructor(private readonly blogsService: BlogsService) {}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(FileInterceptor('banner', multerImageOptions))
	create(
		@Body() dto: CreateBlogDto,
		@UploadedFile() banner: Express.Multer.File,
		@Req() req: any,
	) {
		return this.blogsService.create(dto, banner, req.user._id)
	}

	@Get()
	findAll(
		@Query('page') page: string = '1',
		@Query('limit') limit: string = '10',
		@Query('sortBy') sortBy: string = 'desc',
	) {
		const pageNum = parseInt(page, 10) || 1
		const limitNum = parseInt(limit, 10) || 10

		return this.blogsService.findAll(pageNum, limitNum, sortBy)
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.blogsService.findOne(id)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Patch(':id')
	@UseInterceptors(FileInterceptor('banner', multerImageOptions))
	update(
		@Param('id') id: string,
		@Body() dto: UpdateBlogDto & { removeBanner?: string },
		@Req() req: any,
		@UploadedFile() banner?: Express.Multer.File,
	) {
		const shouldRemoveBanner = dto.removeBanner === 'true'
		return this.blogsService.update(
			id,
			dto,
			req.user._id,
			banner,
			shouldRemoveBanner,
		)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Delete(':id')
	remove(@Param('id') id: string, @Req() req: any) {
		return this.blogsService.remove(id, req.user._id, req.user.role)
	}
}
