import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';

console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API key:', process.env.CLOUDINARY_API_KEY);
console.log(process.env.CLOUDINARY_API_SECRET);
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  
}
);
console.log('Cloudinary loaded:', process.env.CLOUDINARY_API_KEY);


export default cloudinary;