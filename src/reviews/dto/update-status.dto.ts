import { IsEnum, IsNotEmpty } from 'class-validator'
import { ReviewStatus } from '../review.schema'

export class UpdateReviewStatusDto {
	@IsNotEmpty()
	@IsEnum(ReviewStatus)
	status!: ReviewStatus
}
