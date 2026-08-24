import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from './auth/auth.module'
import { BlogsModule } from './blogs/blogs.module'
import { CategoriesModule } from './categories/categories.module'
import { OrdersModule } from './orders/orders.module'
import { ProductsModule } from './products/products.module'
import { ReviewsModule } from './reviews/reviews.module'
import { UsersModule } from './users/users.module'
import { SubscribersModule } from './subscribers/subscribers.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>('DATABASE_URL'),
			}),
		}),
		AuthModule,
		UsersModule,
		CategoriesModule,
		ProductsModule,
		OrdersModule,
		ReviewsModule,
		BlogsModule,
		SubscribersModule,
	],
})
export class AppModule {}
