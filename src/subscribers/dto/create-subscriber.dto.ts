import { IsEmail, IsNotEmpty } from 'class-validator'

export class CreateSubscriberDto {
	@IsNotEmpty({ message: 'Email placeholder cannot be empty' })
	@IsEmail({}, { message: 'Please provide a valid email address' })
	email!: string
}
