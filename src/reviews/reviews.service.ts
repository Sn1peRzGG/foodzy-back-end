import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CreateReviewObjDto } from './dto/create-review.dto'
import { UpdateReviewObjDto } from './dto/update-review.dto'
import { Review, ReviewDocument, ReviewStatus } from './review.schema'

@Injectable()
export class ReviewsService {
	private readonly forbiddenWords = [
		'http://',
		'https://',
		'www.',
		'.com',
		'.org',
		'.net',
		'.edu',
		'free',
		'scam',
		'crypto',
		'bitcoin',
		'promocode',
		'promo code',
		'discount code',
		'coupon',
		'cashback',
		'cash back',
		'buy here',
		'click here',
		'cure',
		'heal disease',
		'miracle drug',
		'lose weight fast',
		'weight loss pill',
	]

	constructor(
		@InjectModel(Review.name)
		private readonly reviewModel: Model<ReviewDocument>,
	) {}

	private getSimilarity(str1: string, str2: string): number {
		const track = Array(str2.length + 1)
			.fill(null)
			.map(() => Array(str1.length + 1).fill(null))
		for (let i = 0; i <= str1.length; i += 1) track[0][i] = i
		for (let j = 0; j <= str2.length; j += 1) track[j][0] = j

		for (let j = 1; j <= str2.length; j += 1) {
			for (let i = 1; i <= str1.length; i += 1) {
				const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
				track[j][i] = Math.min(
					track[j][0] + 1,
					track[0][i] + 1,
					track[j - 1][i - 1] + indicator,
				)
			}
		}
		const distance = track[str2.length][str1.length]
		const maxLength = Math.max(str1.length, str2.length)
		return maxLength === 0 ? 1 : 1 - distance / maxLength
	}

	private autoModerate(text: string): ReviewStatus {
		const lowerText = text.toLowerCase()

		const hasDirectMatch = this.forbiddenWords.some(word => {
			if (word.includes(' ') || word.includes('.') || word.includes('://')) {
				return lowerText.includes(word)
			}
			const regex = new RegExp(`\\b${word}\\b`, 'i')
			return regex.test(lowerText)
		})

		if (hasDirectMatch) return ReviewStatus.REJECTED

		const normalizedText = lowerText
			.replace(/@/g, 'a')
			.replace(/\$/g, 's')
			.replace(/0/g, 'o')
			.replace(/1/g, 'i')
			.replace(/[^a-z0-9\s]/g, '')

		const wordsInReview = normalizedText.split(/\s+/)

		for (const userWord of wordsInReview) {
			if (userWord.length < 4) continue
			for (const bannedWord of this.forbiddenWords) {
				if (bannedWord.includes(' ') || bannedWord.length < 4) continue

				const similarity = this.getSimilarity(userWord, bannedWord)
				if (similarity >= 0.8) {
					return ReviewStatus.REJECTED
				}
			}
		}

		return ReviewStatus.APPROVED
	}

	async create(dto: CreateReviewObjDto, userId: string): Promise<Review> {
		const status = this.autoModerate(dto.text)
		const review = new this.reviewModel({
			...dto,
			user: userId,
			status,
		})
		return review.save()
	}

	async updateOwn(
		id: string,
		dto: UpdateReviewObjDto,
		userId: string,
	): Promise<Review> {
		const review = await this.reviewModel.findById(id)
		if (!review) throw new NotFoundException('Review not found')

		if (review.user !== userId) {
			throw new ForbiddenException('You can only edit your own reviews')
		}

		const status = this.autoModerate(dto.text)

		const updated = await this.reviewModel.findByIdAndUpdate(
			id,
			{ ...dto, status },
			{ returnDocument: 'after' },
		)
		return updated!
	}

	async updateStatus(id: string, status: ReviewStatus): Promise<Review> {
		const review = await this.reviewModel.findByIdAndUpdate(
			id,
			{ status },
			{ returnDocument: 'after' },
		)
		if (!review) throw new NotFoundException('Review not found')
		return review
	}

	async remove(
		id: string,
		userId: string,
		userRole: string,
	): Promise<{ success: boolean }> {
		const review = await this.reviewModel.findById(id)
		if (!review) throw new NotFoundException('Review not found')

		const isOwnerOrAdmin = userRole === 'ADMIN' || userRole === 'OWNER'
		const isAuthor = review.user === userId

		if (!isAuthor && !isOwnerOrAdmin) {
			throw new ForbiddenException(
				'You do not have permission to delete this review',
			)
		}

		await this.reviewModel.findByIdAndDelete(id)
		return { success: true }
	}

	async findApprovedByProduct(productId: string): Promise<Review[]> {
		return this.reviewModel
			.find({ product: productId, status: ReviewStatus.APPROVED })
			.populate('user', 'firstName lastName avatarUrl')
			.populate('product', 'name')
			.exec()
	}

	async findAllForAdmin(): Promise<Review[]> {
		return this.reviewModel
			.find()
			.populate('user', 'email firstName lastName')
			.populate('product', 'name')
			.exec()
	}
}
