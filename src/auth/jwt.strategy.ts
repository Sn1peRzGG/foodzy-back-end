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
			secretOrKey: 'super-secret-key',
		})
	}

	async validate(payload: any) {
		const user = await this.userModel.findOne({ userId: payload.sub })

		if (!user) {
			throw new UnauthorizedException()
		}
		return user
	}
}
