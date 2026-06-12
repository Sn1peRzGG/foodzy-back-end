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
	Req,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { BlogsService } from './blogs.service'
import { CreateBlogDto } from './dto/create.dto'
import { UpdateBlogDto } from './dto/update.dto'
import { multerImageOptions } from '../common/config/multer.config'

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
	findAll() {
		return this.blogsService.findAll()
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
