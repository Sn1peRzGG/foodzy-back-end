import { IsNotEmpty, IsString } from 'class-validator'

export class UpdateOrderAddressDto {
	@IsString()
	@IsNotEmpty()
	deliveryAddress!: string
}
