import { PartialType } from '@nestjs/mapped-types'
import { CreateUserDto } from './create.dto'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class UpdateUserDto extends PartialType(CreateUserDto) {
	@IsOptional()
	@IsEnum(['USER', 'ADMIN'])
	role?: string
}

export class CartItemDto {
	@IsString()
	product!: string

	@IsOptional()
	quantity?: number
}
