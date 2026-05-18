import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import { join } from 'path'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule)

	app.use(cookieParser())

	app.enableCors({
		origin: 'http://localhost:3000',
		credentials: true,
	})

	app.useStaticAssets(join(process.cwd(), 'public'), {
		prefix: '/',
	})

	app.setGlobalPrefix('api/v1')

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
			stopAtFirstError: false,
			transformOptions: {
				enableImplicitConversion: true,
			},
			exceptionFactory: errors => {
				const formattedErrors: Record<string, string[]> = {}

				const parseErrors = (errorsList: any[], parent?: string) => {
					for (const error of errorsList) {
						const property = parent
							? `${parent}.${error.property}`
							: error.property

						if (error.constraints) {
							formattedErrors[property] = Object.values(error.constraints)
						}

						if (error.children?.length) {
							parseErrors(error.children, property)
						}
					}
				}

				parseErrors(errors)

				return new BadRequestException({
					message: 'Validation failed',
					errors: formattedErrors,
				})
			},
		}),
	)

	await app.listen(process.env.PORT ?? 5555)
}

bootstrap()
