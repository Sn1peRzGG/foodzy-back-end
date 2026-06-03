import { Type } from 'class-transformer'
import {
	IsArray,
	IsNotEmpty,
	IsNumber,
	IsPhoneNumber,
	IsString,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from 'class-validator'

class CreateOrderItemDto {
	@IsString()
	@IsNotEmpty()
	product!: string

	@IsNumber()
	@Min(1)
	quantity!: number
}

export class CreateOrderDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateOrderItemDto)
	items!: CreateOrderItemDto[]

	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	@MaxLength(100)
	city!: string

	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	@MaxLength(255)
	address!: string

	@IsPhoneNumber(undefined, {
		message: 'Invalid phone number',
	})
	phoneNumber!: string
}
