import { PartialType } from '@nestjs/mapped-types'
import { CreateBlogDto } from './create.dto'

export class UpdateBlogDto extends PartialType(CreateBlogDto) {}
