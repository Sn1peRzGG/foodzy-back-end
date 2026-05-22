import {
	IsInt,
	IsMongoId,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateProductDto {
	@IsString()
	@MinLength(3)
	@MaxLength(120)
	name!: string

	@IsOptional()
	@IsString()
	@MaxLength(5000)
	description?: string

	@IsMongoId()
	category!: string

	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	price!: number

	@IsOptional()
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	oldPrice?: number

	@IsOptional()
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 1 })
	@Min(0)
	@Max(5)
	rating?: number
}
