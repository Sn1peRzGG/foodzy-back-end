import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	Param,
	Patch,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common'
import * as express from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreateReviewObjDto } from './dto/create-review.dto'
import { UpdateReviewObjDto } from './dto/update-review.dto'
import { UpdateReviewStatusDto } from './dto/update-status.dto'
import { ReviewsService } from './reviews.service'

interface UserPayload {
	_id: string
	email: string
	role: string
}

interface RequestWithUser extends express.Request {
	user: UserPayload
}

@Controller('reviews')
export class ReviewsController {
	constructor(private readonly reviewsService: ReviewsService) {}

	@Get('product/:productId')
	async getProductReviews(@Param('productId') productId: string) {
		return this.reviewsService.findApprovedByProduct(productId)
	}

	@UseGuards(JwtAuthGuard)
	@Post()
	async createReview(
		@Req() req: RequestWithUser,
		@Body() dto: CreateReviewObjDto,
	) {
		return this.reviewsService.create(dto, req.user._id)
	}

	@UseGuards(JwtAuthGuard)
	@Patch(':id')
	async updateReview(
		@Param('id') id: string,
		@Req() req: RequestWithUser,
		@Body() dto: UpdateReviewObjDto,
	) {
		return this.reviewsService.updateOwn(id, dto, req.user._id)
	}

	@UseGuards(JwtAuthGuard)
	@Get('admin/all')
	async getAllForAdmin(@Req() req: RequestWithUser) {
		if (req.user.role !== 'ADMIN' && req.user.role !== 'OWNER') {
			throw new ForbiddenException('Access denied')
		}
		return this.reviewsService.findAllForAdmin()
	}

	@UseGuards(JwtAuthGuard)
	@Patch('admin/:id/status')
	async changeStatus(
		@Param('id') id: string,
		@Req() req: RequestWithUser,
		@Body() dto: UpdateReviewStatusDto,
	) {
		if (req.user.role !== 'ADMIN' && req.user.role !== 'OWNER') {
			throw new ForbiddenException('Access denied')
		}
		return this.reviewsService.updateStatus(id, dto.status)
	}

	@UseGuards(JwtAuthGuard)
	@Delete(':id')
	async deleteReview(@Param('id') id: string, @Req() req: RequestWithUser) {
		return this.reviewsService.remove(id, req.user._id, req.user.role)
	}
}
