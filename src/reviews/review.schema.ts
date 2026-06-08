import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export type ReviewDocument = Review & Document

export enum ReviewStatus {
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
}

@Schema({
	timestamps: true,
	versionKey: false,
})
export class Review {
	@Prop({
		type: String,
		default: () => randomUUID(),
	})
	_id!: string

	@Prop({
		type: String,
		ref: 'Product',
		required: true,
	})
	product!: string

	@Prop({
		type: String,
		ref: 'User',
		required: true,
	})
	user!: string

	@Prop({
		required: true,
		min: 0,
		max: 5,
	})
	rating!: number

	@Prop({
		required: true,
		trim: true,
	})
	text!: string

	@Prop({
		type: String,
		enum: Object.values(ReviewStatus),
		default: ReviewStatus.PENDING,
	})
	status!: ReviewStatus
}

export const ReviewSchema = SchemaFactory.createForClass(Review)

async function updateProductRating(model: any, productId: string) {
	if (!productId) return

	const stats = await model.aggregate([
		{ $match: { product: productId, status: ReviewStatus.APPROVED } },
		{ $group: { _id: '$product', avgRating: { $avg: '$rating' } } },
	])

	const newRating =
		stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0

	await model.db
		.model('Product')
		.findByIdAndUpdate(productId, { rating: newRating })
}

ReviewSchema.post('save', async function (doc) {
	const model = doc.$model('Review')
	await updateProductRating(model, doc.product)
})

ReviewSchema.post('findOneAndUpdate', async function (doc) {
	if (doc) {
		const model = doc.$model('Review')
		await updateProductRating(model, doc.product)
	}
})

ReviewSchema.post('findOneAndDelete', async function (doc) {
	if (doc) {
		const model = doc.$model('Review')
		await updateProductRating(model, doc.product)
	}
})
