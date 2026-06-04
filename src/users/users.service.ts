import {
	ConflictException,
	ForbiddenException,
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
import { CartItemDto, UpdateUserDto } from './dto/update.dto'
import { User, UserDocument } from './user.schema'

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
	) {}

	private readonly uploadPath = join(process.cwd(), 'public', 'users')

	private async saveFile(file: Express.Multer.File) {
		if (!existsSync(this.uploadPath))
			mkdirSync(this.uploadPath, { recursive: true })
		const filename = `${randomUUID()}${extname(file.originalname)}`
		const filepath = join(this.uploadPath, filename)
		await fs.writeFile(filepath, file.buffer)
		return `/users/${filename}`
	}

	private async deleteFile(path: string) {
		try {
			await fs.unlink(join(process.cwd(), 'public', path.replace(/^\/+/, '')))
		} catch {}
	}

	private sanitizeUser(user: any) {
		const { password, ...safeUser } =
			user instanceof Model ? user.toObject() : user
		return safeUser
	}

	async create(dto: CreateUserDto, file?: Express.Multer.File) {
		const emailExists = await this.userModel.findOne({
			email: dto.email.toLowerCase(),
		})
		if (emailExists) throw new ConflictException('Email already exists')

		const phoneExists = await this.userModel.findOne({
			phoneNumber: dto.phoneNumber,
		})
		if (phoneExists) throw new ConflictException('Phone number already exists')

		let avatarUrl = ''
		try {
			const hashedPassword = await bcrypt.hash(dto.password, 10)
			if (file) avatarUrl = await this.saveFile(file)

			const user = await this.userModel.create({
				...dto,
				email: dto.email.toLowerCase(),
				password: hashedPassword,
				avatarUrl: avatarUrl || undefined,
			})
			return this.sanitizeUser(user)
		} catch (error) {
			if (avatarUrl) await this.deleteFile(avatarUrl)
			throw new InternalServerErrorException('Failed to create user')
		}
	}

	async findAll() {
		const users = await this.userModel
			.find()
			.populate({ path: 'cart.product', match: { isDeleted: false } })
			.populate({ path: 'wishlist', match: { isDeleted: false } })
			.lean()

		return users.map(u => {
			if (u.cart) u.cart = u.cart.filter(item => item.product !== null)
			if (u.wishlist) u.wishlist = u.wishlist.filter(item => item !== null)
			return this.sanitizeUser(u)
		})
	}

	async findOne(id: string) {
		const user = await this.userModel
			.findById(id)
			.populate({
				path: 'cart.product',
				match: { isDeleted: false },
			})
			.populate({
				path: 'wishlist',
				match: { isDeleted: false },
			})
			.lean()

		if (!user) throw new NotFoundException('User not found')

		if (user.cart) {
			user.cart = user.cart.filter(item => item.product !== null)
		}

		if (user.wishlist) {
			user.wishlist = user.wishlist.filter(item => item !== null)
		}

		return this.sanitizeUser(user)
	}

	async findByEmail(email: string) {
		return this.userModel
			.findOne({ email: email.toLowerCase() })
			.select('+password')
	}

	async update(
		id: string,
		dto: UpdateUserDto,
		currentUserRole: string,
		file?: Express.Multer.File,
	) {
		const current = await this.userModel.findById(id)
		if (!current) throw new NotFoundException('User not found')

		if (current.role === 'OWNER' && currentUserRole !== 'OWNER') {
			throw new ForbiddenException('You cannot modify the Owner account')
		}

		const updateData: any = { ...dto }
		if (dto.password) updateData.password = await bcrypt.hash(dto.password, 10)
		if (dto.email) updateData.email = dto.email.toLowerCase()

		let avatarUrl = current.avatarUrl
		try {
			if (file) {
				avatarUrl = await this.saveFile(file)
				if (current.avatarUrl) await this.deleteFile(current.avatarUrl)
			}
			const updated = await this.userModel
				.findByIdAndUpdate(
					id,
					{ ...updateData, avatarUrl },
					{ returnDocument: 'after' },
				)
				.lean()
			return this.sanitizeUser(updated)
		} catch {
			if (file && avatarUrl !== current.avatarUrl)
				await this.deleteFile(avatarUrl)
			throw new InternalServerErrorException('Update failed')
		}
	}

	async remove(id: string) {
		const user = await this.userModel.findByIdAndDelete(id)
		if (!user) throw new NotFoundException('User not found')
		if (user.avatarUrl) await this.deleteFile(user.avatarUrl)
		return { success: true }
	}

	async removeMe(id: string, currentUserRole: string) {
		const user = await this.userModel.findById(id)
		if (!user) throw new NotFoundException('User not found')

		if (user.role === 'OWNER' && currentUserRole !== 'OWNER') {
			throw new ForbiddenException('You cannot delete the Owner account')
		}

		await this.userModel.findByIdAndDelete(id)

		if (user.avatarUrl) {
			await this.deleteFile(user.avatarUrl)
		}

		return { success: true }
	}

	async addToCart(id: string, item: CartItemDto) {
		const user = await this.userModel.findById(id)
		if (!user) throw new NotFoundException('User not found')

		const existingItemIndex = user.cart.findIndex(
			cartItem => cartItem.product.toString() === item.product,
		)

		if (existingItemIndex > -1) {
			user.cart[existingItemIndex].quantity += item.quantity || 1
		} else {
			user.cart.push({
				product: item.product,
				quantity: item.quantity || 1,
			})
		}

		await user.save()

		const populatedUser = await this.userModel
			.findById(id)
			.select('cart')
			.populate('cart.product')
			.lean()

		return populatedUser?.cart || []
	}

	async removeFromCart(id: string, productId: string) {
		const updated = await this.userModel
			.findByIdAndUpdate(
				id,
				{ $pull: { cart: { product: productId } } },
				{ returnDocument: 'after' },
			)
			.select('cart')
			.populate('cart.product')
			.lean()

		if (!updated) throw new NotFoundException('User not found')
		return updated.cart
	}

	async toggleWishlist(id: string, productId: string) {
		const user = await this.userModel.findById(id)
		if (!user) throw new NotFoundException('User not found')

		const exists = user.wishlist.includes(productId)
		const update = exists
			? { $pull: { wishlist: productId } }
			: { $addToSet: { wishlist: productId } }

		const updated = await this.userModel
			.findByIdAndUpdate(id, update, { returnDocument: 'after' })
			.select('wishlist')
			.populate('wishlist')
			.lean()

		return updated?.wishlist || []
	}
}
