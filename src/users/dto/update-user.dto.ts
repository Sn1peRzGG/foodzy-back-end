import { PartialType } from '@nestjs/mapped-types'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { CreateUserDto } from './create-user.dto'

export class UpdateUserDto extends PartialType(CreateUserDto) {
	@IsOptional()
	@IsEnum(['USER', 'ADMIN', 'OWNER'])
	role?: string
}

export class CartItemDto {
	@IsString()
	product!: string

	@IsOptional()
	quantity?: number
}
