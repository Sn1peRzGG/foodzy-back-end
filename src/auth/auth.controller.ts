import {
	Body,
	Controller,
	Get,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common'
import * as express from 'express'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { UsersService } from '../users/users.service'

interface UserPayload {
	_id: string
	email: string
	role: string
}

interface RequestWithUser extends express.Request {
	user: UserPayload
}

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly usersService: UsersService,
	) {}

	@Post('login')
	async login(
		@Body() body: Record<string, string>,
		@Res({ passthrough: true }) res: express.Response,
	): Promise<{ message: string }> {
		const user = await this.authService.validateUser(body.email, body.password)
		if (!user) {
			throw new UnauthorizedException()
		}
		const tokenData = await this.authService.login(user)
		res.cookie('jwt', tokenData.access_token, { httpOnly: true })
		return { message: 'Success' }
	}

	@Post('logout')
	logout(@Res({ passthrough: true }) res: express.Response): {
		message: string
	} {
		res.clearCookie('jwt')
		return { message: 'Logged out' }
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	async getMe(@Req() req: RequestWithUser) {
		return this.usersService.findOne(req.user._id)
	}
}
