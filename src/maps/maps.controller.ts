import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Detection, MapsService, Similarity } from './maps.service';
import { ImageJob } from '../types/job.dto';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Post('similarity')
  async similarity(@Body() job: ImageJob): Promise<Similarity> {
    const result = await this.mapsService.similarity(job);
    if (typeof result === 'string') {
      throw new HttpException(result, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return result;
  }

  @Post('detection')
  async detection(@Body() job: ImageJob): Promise<Detection> {
    const result = await this.mapsService.objectDetection(job);
    if (typeof result === 'string') {
      throw new HttpException(result, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return result;
  }
}
