import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require('crypto');
import { ImageJob } from '../types/job.dto';
import { isMainnet, ML_API_URL } from '../api/env';
import axios from 'axios';
import { SupabaseService } from '../supabase/supabase.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ErgoAddress, Network } from '@fleet-sdk/core';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { generateMnemonic } from 'bip39';
import { BackendWallet } from '../api/rust/BackendWallet';
import { decode } from 'base64-arraybuffer';

export interface Similarity {
  similarity_score: number;
}
export interface UpdateTag {
  sha256Hash: string;
  stairs: boolean;
  ramps: boolean;
  guard_rails: boolean;
}
export interface UpdateImage {
  sha256Hash: string;
  stairs: boolean;
  ramps: boolean;
  guard_rails: boolean;
  image: string;
  long: number;
  lat: number;
  userId: string;
}
export interface Detection {
  stairs: boolean;
  ramps: boolean;
  guard_rails: boolean;
}

export interface Message {
  message: boolean;
}

export interface Submission {
  image: string;
  long: number;
  lat: number;
  userId: string;
}

export interface Init {
  userId: string;
}

@Injectable()
export class MapsService {
  private readonly DEFAULT_WALLET_STRENGTH = 160;
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly blockchainService: BlockchainService,
  ) {}
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
  getHash(base64Image: string): string {
    const buffer = Buffer.from(base64Image, 'base64');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async checkImageHash(base64Image: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const sha256Hash = this.getHash(base64Image);

    const { data, error } = await supabase
      .from('Image')
      .select('sha256_hash')
      .eq('sha256_hash', sha256Hash);

    if (error) {
      console.log('error checking hash');
      return false;
    }
    return data.length > 0;
  }

  async submission(param: Submission) {
    const b64: string = param.image;
    const userId: string = param.userId;

    let similarity: number;

    try {
      const res = await this.similarity({
        image: b64,
      });
      if (typeof res === 'string') {
        throw Error(res);
      }
      similarity = res.similarity_score;
    } catch (error) {
      console.log('error with submission similarity');
      return false;
    }

    if (similarity >= 0.5) {
      console.log('too similar:', similarity);
      return false;
    }

    let tags: Detection;
    let dbAdd: boolean;

    try {
      const res = await this.objectDetection({
        image: b64,
      });
      if (typeof res === 'string') {
        throw new Error(res);
      }
      tags = res;
      dbAdd = await this.addImageToDatabase(param, tags);
    } catch (error) {
      console.log('error with object detection');
      dbAdd = await this.addImageToDatabase(param, {
        ramps: false,
        stairs: false,
        guard_rails: false,
      });
    }

    if (!dbAdd) {
      return false;
    }

    // reward user

    const address = await this.getUserAddress(userId);
    const rewardAmount = 100000000;

    try {
      if (!address || !ErgoAddress.validate(address)) {
        throw new Error('undefined address');
      }
      const rewardStatus = await this.blockchainService.dispatchSend({
        amount: rewardAmount,
        recipient: address,
      });
    } catch (error) {
      console.log('error with rewarding address:', address);
      console.log(error);
    }
    return true;
  }

  async getUserAddress(userId: string): Promise<string | undefined> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('Blockchain')
      .select('address')
      .eq('user_id', userId);

    if (error || data.length === 0) {
      console.log('error getting address');
      return undefined;
    }
    return data[0].address;
  }

  async addImageToDatabase(
    params: Submission,
    tags: Detection,
  ): Promise<boolean> {
    let hash: string;
    try {
      hash = this.getHash(params.image);
    } catch (error) {
      console.log(error);
      console.log('could not hash image');
      return false;
    }
    const { data, error } = await this.supabaseService
      .getClient()
      .from('Image')
      .insert([
        {
          imageB64: params.image,
          sha256_hash: hash,
          stairs: tags.stairs,
          ramps: tags.ramps,
          guard_rails: tags.guard_rails,
          latitude: params.lat,
          longitude: params.long,
          user_id: params.userId,
        },
      ]);

    if (error) {
      console.log('image upsert error');
      console.log(error);
      return false;
    }

    const { data: uploadData, error: uploadError } = await this.supabaseService
      .getClient()
      .storage.from('image')
      .upload(`${hash}.png`, decode(params.image), {
        upsert: false,
        contentType: 'image/png',
      });

    console.log(uploadData);

    if (uploadError) {
      console.log('uploadError upsert error');
    }

    return true;
  }

  async updateImageInDatabase(
    sha256Hash: string,
    updatedTags?: Detection,
    updatedParams?: Submission,
  ): Promise<boolean> {
    try {
      const { data: existingData, error: selectError } =
        await this.supabaseService
          .getClient()
          .from('Image')
          .select('*')
          .eq('sha256_hash', sha256Hash)
          .single();

      if (selectError || !existingData) {
        console.log('error finding or image not found');
        console.log(selectError);
        return false;
      }

      // Construct update payload based on provided arguments
      const updatePayload = {};
      if (updatedTags) {
        updatePayload['stairs'] = updatedTags.stairs;
        updatePayload['ramps'] = updatedTags.ramps;
        updatePayload['guard_rails'] = updatedTags.guard_rails;
      }
      if (updatedParams) {
        updatePayload['latitude'] = updatedParams.lat;
        updatePayload['longitude'] = updatedParams.long;
        updatePayload['user_id'] = updatedParams.userId;
        updatePayload['imageB64'] = updatedParams.image;
      }

      // If no updates, return false
      if (Object.keys(updatePayload).length === 0) {
        console.log('No updates provided');
        return false;
      }

      // Perform the update
      const { error: updateError } = await this.supabaseService
        .getClient()
        .from('Image')
        .update(updatePayload)
        .eq('sha256_hash', sha256Hash);

      if (updateError) {
        console.log('image update error');
        console.log(updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async initUser(userId: string): Promise<boolean> {
    const mnemonic = generateMnemonic(this.DEFAULT_WALLET_STRENGTH);
    const wallet = new BackendWallet(
      mnemonic,
      '',
      isMainnet() ? Network.Mainnet : Network.Testnet,
    );
    let address: string;
    try {
      address = wallet.getAddress(0);
    } catch (error) {
      console.log('error getting wallet address and making wallet entry');
      return false;
    }
    const { data, error } = await this.supabaseService
      .getClient()
      .from('Blockchain')
      .insert([
        {
          user_id: userId,
          address: address,
          mnemonic: mnemonic,
        },
      ]);
    if (error) {
      console.log('error making wallet entry');
      return false;
    }
    return true;
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
