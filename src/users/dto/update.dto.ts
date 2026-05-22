import { PartialType } from '@nestjs/mapped-types'
import { CreateUserDto } from './create.dto'
import {
	ArrayUnique,
	IsArray,
	IsEnum,
	IsInt,
	IsMongoId,
	IsOptional,
	Min,
	ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class CartItemDto {
	@IsMongoId({ message: 'productId must be a valid Mongo ObjectId' })
	product!: string

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
	@IsMongoId({
		each: true,
		message: 'Each wishlist item must be a valid Mongo ObjectId',
	})
	wishlist?: string[]
}
