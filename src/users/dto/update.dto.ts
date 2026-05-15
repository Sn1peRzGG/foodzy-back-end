import { PartialType } from '@nestjs/mapped-types'
import { CreateUserDto } from './create.dto'
import {
	ArrayUnique,
	IsArray,
	IsEnum,
	IsInt,
	IsOptional,
	Min,
	ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class CartItemDto {
	@Type(() => Number)
	@IsInt()
	@Min(1)
	productId!: number

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	quantity?: number
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
	@IsOptional()
	@IsEnum(['USER', 'ADMIN'])
	role?: string

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CartItemDto)
	cart?: CartItemDto[]

	@IsOptional()
	@IsArray()
	@ArrayUnique()
	@IsInt({ each: true })
	wishlist?: number[]
}
