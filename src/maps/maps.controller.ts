import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  Detection,
  Init,
  MapsService,
  Message,
  Similarity,
  Submission,
  UpdateImage,
  UpdateTag,
} from './maps.service';
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

  @Post('checkImage')
  async checkImage(@Body() param: { base64Image: string }): Promise<Message> {
    const result = await this.mapsService.checkImageHash(param.base64Image);
    return { message: result };
  }

  @Post('submission')
  async submission(@Body() param: Submission): Promise<Message> {
    const result = await this.mapsService.submission(param);
    return { message: result };
  }

  @Post('init')
  async init(@Body() param: Init): Promise<Message> {
    const result = await this.mapsService.initUser(param.userId);
    return { message: result };
  }

  @Post('updateTags')
  async updateTags(@Body() param: UpdateTag): Promise<Message> {
    const result = await this.mapsService.updateImageInDatabase(
      param.sha256Hash,
      {
        stairs: param.stairs,
        ramps: param.ramps,
        guard_rails: param.guard_rails,
      },
    );
    return { message: result };
  }

  @Post('updateImage')
  async updateImage(@Body() param: UpdateImage): Promise<Message> {
    const result = await this.mapsService.updateImageInDatabase(
      param.sha256Hash,
      {
        stairs: param.stairs,
        ramps: param.ramps,
        guard_rails: param.guard_rails,
      },
      {
        image: param.image,
        long: param.long,
        lat: param.lat,
        userId: param.userId,
      },
    );
    return { message: result };
  }
}
