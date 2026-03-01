import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { NotFoundException } from '@nestjs/common';
import cloudinary from '../cloudinary.config';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get('sales/summary')
  getSalesSummary(@Query('period') period: string = 'weekly') {
    const safePeriod = period === 'monthly' ? 'monthly' : 'weekly';
    return this.productService.getSalesSummary(safePeriod);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const pid = Number(id);
    const product = await this.productService.findOne(pid);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Post()
@UseInterceptors(FileInterceptor('image'))
async create(
  @UploadedFile() file: Express.Multer.File,
  @Body() body: any,
) {
  let imageUrl: string | null = null;
  let imagePublicId: string | null = null;

  if (file) {
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'products' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(file.buffer);
    });

    imageUrl = result.secure_url;
    imagePublicId = result.public_id;
  }

  const productData = {
    ...body,
    price: Number(body.price),
    stock: Number(body.stock),
    imageUrl,
    imagePublicId,
  };

  return this.productService.create(productData);
}

 @Delete(':id')
async remove(@Param('id') id: number) {

  const product = await this.productService.findOne(id);

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  // delete image from Cloudinary
  if (product.imagePublicId) {
    await cloudinary.uploader.destroy(product.imagePublicId);
  }

  // delete from database
  return this.productService.remove(id);
}

@Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: number,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const product = await this.productService.findOne(id);
    if (!product) throw new NotFoundException('Product not found');

    let imageUrl = product.imageUrl;
    let imagePublicId = product.imagePublicId;

    // If a new image is uploaded, replace the old one
    if (file) {
      // Delete old image from Cloudinary
      if (product.imagePublicId) {
        await cloudinary.uploader.destroy(product.imagePublicId);
      }

      // Upload new image
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: 'products' }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(file.buffer);
      });

      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const updatedData = {
      ...body,
      price: body.price !== undefined ? Number(body.price) : product.price,
      stock: body.stock !== undefined ? Number(body.stock) : product.stock,
      imageUrl,
      imagePublicId,
    };

    return this.productService.update(id, updatedData);
  }
}