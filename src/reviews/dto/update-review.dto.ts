import {
	IsNotEmpty,
	IsNumber,
	IsString,
	Max,
	Min,
	Length,
} from 'class-validator'

export class UpdateReviewObjDto {
	@IsNotEmpty()
	@IsNumber()
	@Min(0)
	@Max(5)
	rating!: number

	@IsNotEmpty()
	@IsString()
	@Length(3, 1000)
	text!: string
}
