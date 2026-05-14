import {
	IsEmail,
	IsString,
	Matches,
	IsOptional,
	IsPhoneNumber,
	MinLength,
} from 'class-validator'

export class CreateUserDto {
	@Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Invalid email format' })
	email!: string

	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/, {
		message:
			'Password too weak: 8+ characters, 1 uppercase, 1 lowercase, 1 number',
	})
	password!: string

	@IsString()
	@MinLength(2)
	firstName!: string

	@IsString()
	@IsOptional()
	lastName?: string

	@IsPhoneNumber(undefined, { message: 'Invalid phone number' })
	phoneNumber!: string

	@IsString()
	@IsOptional()
	city?: string

	@IsString()
	@IsOptional()
	address?: string

	@IsString()
	@IsOptional()
	avatarUrl?: string
}
