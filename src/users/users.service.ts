import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as bcrypt from 'bcrypt'
import { Model } from 'mongoose'
import { User, UserDocument } from './user.schema'

@Injectable()
export class UsersService {
	constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

	async create(data: any): Promise<User> {
		const lastUser = await this.userModel.findOne().sort('-userId')
		const userId = lastUser && lastUser.userId ? lastUser.userId + 1 : 1
		const hashedPassword = await bcrypt.hash(data.password, 10)
		const createdUser = new this.userModel({
			...data,
			userId,
			password: hashedPassword,
		})
		return createdUser.save()
	}

	async findAll(): Promise<User[]> {
		return this.userModel.find().exec()
	}

	async findOne(userId: number): Promise<User> {
		const user = await this.userModel.findOne({ userId }).exec()
		if (!user) throw new NotFoundException()
		return user
	}

	async findByEmail(email: string): Promise<UserDocument> {
		return (await this.userModel.findOne({ email }).exec())!
	}

	async update(userId: number, data: any): Promise<User> {
		if (data.password) {
			data.password = await bcrypt.hash(data.password, 10)
		}
		const updated = await this.userModel
			.findOneAndUpdate({ userId }, data, { new: true })
			.exec()
		if (!updated) throw new NotFoundException()
		return updated
	}

	async remove(userId: number): Promise<any> {
		const deleted = await this.userModel.findOneAndDelete({ userId }).exec()
		if (!deleted) throw new NotFoundException()
		return deleted
	}
}
