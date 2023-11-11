import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { ImageJob } from '../types/job.dto';
import { ML_API_URL } from '../api/env';
import axios from 'axios';
import { SupabaseService } from '../supabase/supabase.service';

export interface Similarity {
  similarity_score: number;
}
export interface Detection {
  stairs: boolean;
  ramps: boolean;
  guard_rails: boolean;
}

@Injectable()
export class MapsService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async similarity(job: ImageJob): Promise<Similarity | string> {
    const url = `${ML_API_URL()}/sim`;
    try {
      const response = await axios.post(url, { image: job.image });
      return response.data;
    } catch (error) {
      console.log('error with similarity endpoint');
      console.log(error.message);
      return error.message;
    }
  }

  async objectDetection(job: ImageJob): Promise<Detection | string> {
    const url = `${ML_API_URL()}/detection`;
    try {
      const response = await axios.post(url, { image: job.image });
      return response.data;
    } catch (error) {
      console.log('error with detection endpoint');
      console.log(error.message);
      return error.message;
    }
  }
  getHash(job: ImageJob): string {
    const b64: string = job.image;
    const buffer = Buffer.from(b64, 'base64');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // get sha256 hash of base64 string
  // see if sha256 hash already exists
  // if exists, return with no rewards
  // else, check similarity
  // if similarity above a certain threshold, reward user

  // rewards
  // grab user id
  // get address by user id
  // send address crypto
}
