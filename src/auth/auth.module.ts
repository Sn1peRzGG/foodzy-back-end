import { Module, forwardRef } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UsersModule } from '../users/users.module'
import { JwtStrategy } from './jwt.strategy'

@Module({
	imports: [
		forwardRef(() => UsersModule),
		PassportModule,
		JwtModule.register({
			secret:
				'1c24cf521a1585154750e6c9737dd533684db5fc07ad842b84afa2d90c9d3d14',
			signOptions: { expiresIn: '7d' },
		}),
	],
	providers: [AuthService, JwtStrategy],
	controllers: [AuthController],
	exports: [AuthService],
})
export class AuthModule {}
