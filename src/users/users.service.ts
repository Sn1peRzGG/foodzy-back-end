import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync } from 'fs'
import * as fs from 'fs/promises'
import { Model } from 'mongoose'
import { extname, join } from 'path'
import { CreateUserDto } from './dto/create.dto'
import { UpdateUserDto } from './dto/update.dto'
import { User, UserDocument } from './user.schema'

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name)
		private readonly userModel: Model<UserDocument>,
	) {}

	private readonly uploadPath = join(process.cwd(), 'public', 'users')

	private async saveFile(file: Express.Multer.File) {
		if (!existsSync(this.uploadPath)) {
			mkdirSync(this.uploadPath, { recursive: true })
		}

		const filename = `${randomUUID()}${extname(file.originalname)}`
		const filepath = join(this.uploadPath, filename)

		await fs.writeFile(filepath, file.buffer)

		return `/users/${filename}`
	}

	private async deleteFile(path: string) {
		try {
			const relativePath = path.replace(/^\/+/, '')

			const fullPath = join(process.cwd(), 'public', relativePath)

			await fs.unlink(fullPath)
		} catch {}
	}

	private sanitizeUser(user: any) {
		const obj = user.toObject ? user.toObject() : user
		const { password, ...safeUser } = obj
		return safeUser
	}

	async create(dto: CreateUserDto, file?: Express.Multer.File) {
		const emailExists = await this.userModel.findOne({
			email: dto.email.toLowerCase(),
		})

		if (emailExists) {
			throw new ConflictException({
				message: 'Email already exists',
				errors: {
					email: ['User with this email already exists'],
				},
			})
		}

		const phoneExists = await this.userModel.findOne({
			phoneNumber: dto.phoneNumber,
		})

		if (phoneExists) {
			throw new ConflictException({
				message: 'Phone number already exists',
				errors: {
					phoneNumber: ['User with this phone number already exists'],
				},
			})
		}

		const lastUser = await this.userModel.findOne().sort({ userId: -1 })
		const userId = lastUser?.userId ? lastUser.userId + 1 : 1

		let avatarUrl = ''

		try {
			const hashedPassword = await bcrypt.hash(dto.password, 10)

			if (file) {
				avatarUrl = await this.saveFile(file)
			}

			const user = await this.userModel.create({
				...dto,
				email: dto.email.toLowerCase(),
				userId,
				password: hashedPassword,
				avatarUrl: avatarUrl || undefined,
			})

			return this.sanitizeUser(user)
		} catch (error) {
			if (avatarUrl) {
				await this.deleteFile(avatarUrl)
			}

			throw new InternalServerErrorException({
				message: 'Failed to create user',
			})
		}
	}

	async findAll() {
		const users = await this.userModel.find().lean()

		return users.map(user => {
			const { password, ...safeUser } = user
			return safeUser
		})
	}

	async findOne(userId: number) {
		const user = await this.userModel.findOne({ userId }).lean()

		if (!user) {
			throw new NotFoundException({
				message: 'User not found',
			})
		}

		const { password, ...safeUser } = user
		return safeUser
	}

	async findByEmail(email: string) {
		const user = await this.userModel
			.findOne({
				email: email.toLowerCase(),
			})
			.select('+password')

		if (!user) {
			throw new NotFoundException({
				message: 'User not found',
			})
		}

		return user
	}

	async update(userId: number, dto: UpdateUserDto, file?: Express.Multer.File) {
		delete (dto as any).userId

		const current = await this.userModel.findOne({
			userId,
		})

		if (!current) {
			throw new NotFoundException({
				message: 'User not found',
			})
		}

		if (dto.email && dto.email !== current.email) {
			const emailExists = await this.userModel.findOne({
				email: dto.email.toLowerCase(),
			})

			if (emailExists) {
				throw new ConflictException({
					message: 'Email already exists',
					errors: {
						email: ['User with this email already exists'],
					},
				})
			}
		}

		if (dto.phoneNumber && dto.phoneNumber !== current.phoneNumber) {
			const phoneExists = await this.userModel.findOne({
				phoneNumber: dto.phoneNumber,
			})

			if (phoneExists) {
				throw new ConflictException({
					message: 'Phone number already exists',
					errors: {
						phoneNumber: ['User with this phone number already exists'],
					},
				})
			}
		}

		if (dto.password) {
			dto.password = await bcrypt.hash(dto.password, 10)
		}

		let avatarUrl = current.avatarUrl

		try {
			if (file) {
				avatarUrl = await this.saveFile(file)
			}

			const updated = await this.userModel.findOneAndUpdate(
				{ userId },
				{
					...dto,
					email: dto.email?.toLowerCase(),
					avatarUrl,
				},
				{
					returnDocument: 'after',
				},
			)

			if (file && current.avatarUrl) {
				await this.deleteFile(current.avatarUrl)
			}

			return this.sanitizeUser(updated)
		} catch {
			if (file && avatarUrl !== current.avatarUrl) {
				await this.deleteFile(avatarUrl)
			}

			throw new InternalServerErrorException({
				message: 'Failed to update user',
			})
		}
	}

	async remove(userId: number) {
		const user = await this.userModel.findOneAndDelete({
			userId,
		})

		if (!user) {
			throw new NotFoundException({
				message: 'User not found',
			})
		}

		if (user.avatarUrl) {
			await this.deleteFile(user.avatarUrl)
		}

		return {
			success: true,
			message: 'User deleted successfully',
		}
	}
}
