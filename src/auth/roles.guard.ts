import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import * as express from 'express'

interface UserPayload {
	userId: number
	email: string
	role: string
}

interface RequestWithUser extends express.Request {
	user?: UserPayload
}

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const roles = this.reflector.get<string[]>('roles', context.getHandler())
		if (!roles) {
			return true
		}
		const request = context.switchToHttp().getRequest<RequestWithUser>()
		const user = request.user
		if (!user) {
			return false
		}
		return roles.includes(user.role)
	}
}
