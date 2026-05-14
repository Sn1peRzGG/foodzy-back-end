import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-jwt'
import { Request } from 'express'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
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
			secretOrKey: 'super-secret-key',
		})
	}

	async validate(payload: any) {
		const user = await this.userModel.findOne({ userId: payload.userId })
		if (!user) {
			throw new UnauthorizedException()
		}
		return user
	}
}
