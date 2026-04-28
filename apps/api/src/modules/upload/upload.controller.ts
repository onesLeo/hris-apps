import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'leave-docs');

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']);

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  filename: string;
  path: string;
}

@Controller('upload')
export class UploadController {
  @Post('leave-document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_EXTENSIONS.has(extname(file.originalname).toLowerCase())) {
          return cb(
            new BadRequestException('Only PDF, image, and Word documents are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadLeaveDocument(@UploadedFile() file: MulterFile) {
    if (!file) throw new BadRequestException('No file provided');
    return {
      fileId: file.filename.split('.')[0],
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
  }
}
