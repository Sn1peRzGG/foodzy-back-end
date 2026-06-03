import { Transform, Type } from 'class-transformer'
import {
	IsBoolean,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator'

export class CreateProductDto {
	@IsString()
	@MinLength(3)
	@MaxLength(120)
	name!: string

	@IsOptional()
	@IsString()
	@MaxLength(5000)
	description?: string

	@IsString()
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

	@IsOptional()
	@IsString()
	weight?: string

	@IsOptional()
	@Transform(({ value }) => Number(value))
	@IsInt()
	@Min(0)
	calories?: number

	@IsOptional()
	@Transform(({ value }) => {
		if (value === 'true' || value === true || value === 1 || value === '1')
			return true
		if (value === 'false' || value === false || value === 0 || value === '0')
			return false
		return value
	})
	@IsBoolean()
	isAvailable?: boolean
}
