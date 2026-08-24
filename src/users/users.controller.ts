import {
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
import { CreateUserDto } from './dto/create-user.dto'
import { CartItemDto, UpdateUserDto } from './dto/update-user.dto'
import { UsersService } from './users.service'

interface AuthenticatedRequest extends Request {
	user: { _id: string; role: string }
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
		if (
			req.user.role !== 'OWNER' &&
			req.user.role !== 'ADMIN' &&
			req.user._id !== id
		)
			throw new ForbiddenException()
		return this.usersService.findOne(id)
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
		if (
			req.user.role !== 'OWNER' &&
			req.user.role !== 'ADMIN' &&
			req.user._id !== id
		)
			throw new ForbiddenException()
		if (req.user.role !== 'OWNER') delete (dto as any).role
		return this.usersService.update(id, dto, req.user.role, file)
	}

	@UseGuards(JwtAuthGuard)
	@Post('cart')
	addToCart(@Req() req: AuthenticatedRequest, @Body() item: CartItemDto) {
		return this.usersService.addToCart(req.user._id, item)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('cart/:productId')
	removeFromCart(
		@Req() req: AuthenticatedRequest,
		@Param('productId') productId: string,
	) {
		return this.usersService.removeFromCart(req.user._id, productId)
	}

	@UseGuards(JwtAuthGuard)
	@Post('wishlist/:productId')
	toggleWishlist(
		@Req() req: AuthenticatedRequest,
		@Param('productId') productId: string,
	) {
		return this.usersService.toggleWishlist(req.user._id, productId)
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('OWNER')
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.usersService.remove(id)
	}
}
