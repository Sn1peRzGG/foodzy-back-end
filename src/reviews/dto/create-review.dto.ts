import {
	IsNotEmpty,
	IsNumber,
	IsString,
	Max,
	Min,
	Length,
} from 'class-validator'

export class CreateReviewObjDto {
	@IsNotEmpty()
	@IsString()
	product!: string

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
