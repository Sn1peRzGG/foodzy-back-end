import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync } from 'fs'
import * as fs from 'fs/promises'
import { Model } from 'mongoose'
import { extname, join } from 'path'
import { Blog, BlogDocument } from './blog.schema'
import { CreateBlogDto } from './dto/create.dto'
import { UpdateBlogDto } from './dto/update.dto'

@Injectable()
export class BlogsService {
	constructor(
		@InjectModel(Blog.name)
		private readonly blogModel: Model<BlogDocument>,
	) {}

	private readonly uploadPath = join(process.cwd(), 'public', 'blogs')

	private async saveFile(file: Express.Multer.File): Promise<string> {
		if (!file) return ''

		if (!existsSync(this.uploadPath)) {
			mkdirSync(this.uploadPath, { recursive: true })
		}

		const filename = `${randomUUID()}${extname(file.originalname)}`
		const filepath = join(this.uploadPath, filename)
		await fs.writeFile(filepath, file.buffer)
		return `/blogs/${filename}`
	}

	private async deleteFile(path: string) {
		if (!path) return
		try {
			const relativePath = path.replace(/^\/+/, '')
			const fullPath = join(process.cwd(), 'public', relativePath)
			await fs.unlink(fullPath)
		} catch {
			// File deleted
		}
	}

	async create(
		dto: CreateBlogDto,
		bannerFile: Express.Multer.File,
		authorId: string,
	) {
		let banner = ''
		try {
			if (bannerFile) {
				banner = await this.saveFile(bannerFile)
			}
			return await this.blogModel.create({ ...dto, banner, authorId })
		} catch {
			if (banner) await this.deleteFile(banner)
			throw new InternalServerErrorException({
				message: 'Failed to create blog post',
			})
		}
	}

	async findAll(page: number = 1, limit: number = 10, sortBy: string = 'desc') {
		const total = await this.blogModel.countDocuments()

		const sortOrder = sortBy === 'asc' ? 1 : -1

		const data = await this.blogModel
			.find()
			.populate('authorId', 'firstName')
			.sort({ createdAt: sortOrder })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean()

		return {
			data,
			meta: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		}
	}

	async findOne(id: string) {
		const blog = await this.blogModel
			.findById(id)
			.populate('authorId', 'firstName')
			.lean()
		if (!blog) {
			throw new NotFoundException({ message: 'Blog post not found' })
		}
		return blog
	}

	async update(
		id: string,
		dto: UpdateBlogDto,
		userId: string,
		bannerFile?: Express.Multer.File,
		shouldRemoveBanner?: boolean,
	) {
		const current = await this.blogModel.findById(id)
		if (!current) {
			throw new NotFoundException({ message: 'Blog post not found' })
		}

		if (current.authorId !== userId) {
			throw new ForbiddenException({
				message: 'You can only edit your own posts',
			})
		}

		let newBanner = ''
		try {
			let finalBanner = current.banner

			if (shouldRemoveBanner) {
				if (current.banner) await this.deleteFile(current.banner)
				finalBanner = ''
			}

			if (bannerFile) {
				if (current.banner) await this.deleteFile(current.banner)
				newBanner = await this.saveFile(bannerFile)
				finalBanner = newBanner
			}

			const { removeBanner: _removeBanner, ...updateData } = dto as any

			return await this.blogModel.findByIdAndUpdate(
				id,
				{ ...updateData, banner: finalBanner },
				{ returnDocument: 'after' },
			)
		} catch {
			if (newBanner) await this.deleteFile(newBanner)
			throw new InternalServerErrorException({
				message: 'Failed to update blog post',
			})
		}
	}

	async remove(id: string, userId: string, userRole: string) {
		const blog = await this.blogModel.findById(id)
		if (!blog) throw new NotFoundException({ message: 'Blog post not found' })

		if (userRole !== 'OWNER' && blog.authorId !== userId) {
			throw new ForbiddenException({
				message: 'You do not have permission to delete this post',
			})
		}

		await this.blogModel.findByIdAndDelete(id)

		if (blog.banner) {
			await this.deleteFile(blog.banner)
		}

		return { success: true, message: 'Blog post deleted successfully' }
	}
}
