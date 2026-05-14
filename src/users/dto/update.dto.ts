import { PartialType } from '@nestjs/mapped-types'
import { CreateUserDto } from './create.dto'
import {
	IsArray,
	IsOptional,
	ValidateNested,
	IsNumber,
	IsEnum,
} from 'class-validator'
import { Type } from 'class-transformer'

class CartItemDto {
	@IsNumber()
	productId!: number

	@IsNumber()
	@IsOptional()
	quantity!: number
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
	@IsNumber({}, { each: true })
	wishlist?: number[]
}
