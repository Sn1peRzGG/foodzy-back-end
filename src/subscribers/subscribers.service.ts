import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CreateSubscriberDto } from './dto/create-subscriber.dto'
import { Subscriber, SubscriberDocument } from './subscriber.schema'

@Injectable()
export class SubscribersService {
	constructor(
		@InjectModel(Subscriber.name)
		private readonly subscriberModel: Model<SubscriberDocument>,
	) {}

	async create(createSubscriberDto: CreateSubscriberDto) {
		const emailNormalized = createSubscriberDto.email.toLowerCase()

		const emailExists = await this.subscriberModel.findOne({
			email: emailNormalized,
		})
		if (emailExists) {
			throw new ConflictException('This email is already subscribed')
		}

		try {
			const newSubscriber = await this.subscriberModel.create({
				email: emailNormalized,
			})
			return newSubscriber
		} catch {
			throw new InternalServerErrorException('Failed to create subscription')
		}
	}

	async findAll() {
		return this.subscriberModel.find().lean()
	}

	async remove(id: string) {
		const subscriber = await this.subscriberModel.findByIdAndDelete(id)
		if (!subscriber) {
			throw new NotFoundException('Subscriber not found')
		}
		return { success: true }
	}
}
