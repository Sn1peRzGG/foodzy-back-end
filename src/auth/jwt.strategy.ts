import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { Model } from 'mongoose'
import { Strategy } from 'passport-jwt'
import { User, UserDocument } from '../users/user.schema'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
		super({
			jwtFromRequest: (req: Request) => {
				if (req && req.cookies) {
					return req.cookies['jwt']
				}
				return null
			},
			ignoreExpiration: false,
			secretOrKey:
				'1c24cf521a1585154750e6c9737dd533684db5fc07ad842b84afa2d90c9d3d14',
		})
	}

	async validate(payload: any) {
		const user = await this.userModel.findById(payload.sub).lean()

		if (!user) {
			throw new UnauthorizedException('User not found or invalid token')
		}

		return {
			_id: user._id,
			role: user.role,
		}
	}
}
