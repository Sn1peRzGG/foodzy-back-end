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

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('login')
	async login(
		@Body() body: any,
		@Res({ passthrough: true }) res: express.Response,
	) {
		const user = await this.authService.validateUser(body.email, body.password)
		if (!user) {
			throw new UnauthorizedException()
		}
		const tokenData = await this.authService.login(user)
		res.cookie('jwt', tokenData.access_token, { httpOnly: true })
		return { message: 'Success' }
	}

	@Post('logout')
	async logout(@Res({ passthrough: true }) res: express.Response) {
		res.clearCookie('jwt')
		return { message: 'Logged out' }
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	getMe(@Req() req: any) {
		return req.user
	}
}
