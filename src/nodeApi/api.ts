import axios from 'axios';
import { BlockchainOutput, ErgoTransaction } from '../types/nodeApi.dto';

export class NodeApi {
  private readonly nodeBaseURI: string;
  constructor(nodeBaseURI: string) {
    this.nodeBaseURI = nodeBaseURI.replace(/[\\/]+$/, '');
  }

  async transactionsUnconfirmedByTransactionId(
    txId: string,
  ): Promise<ErgoTransaction> {
    const url = `${this.nodeBaseURI}/transactions/unconfirmed/byTransactionId/${txId}`;
    const response = await axios.get(url);
    return response.data;
  }

  async getBoxesUnspentByAddress(
    address: string,
    limit = 50,
    offset = 0,
    sortDirection = 'desc',
  ): Promise<BlockchainOutput[]> {
    const url = `${this.nodeBaseURI}/blockchain/box/unspent/byAddress?limit=${limit}&offset=${offset}&sortDirection=${sortDirection}`;
    const response = await axios.post(url, address);
    return response.data;
  }

  async getTransactionsUnconfirmedByErgoTree(
    ergoTree: string,
    limit = 50,
    offset = 0,
  ): Promise<ErgoTransaction[]> {
    const url = `${this.nodeBaseURI}/transactions/unconfirmed/byErgoTree?limit=${limit}&offset=${offset}`;
    const response = await axios.post(url, ergoTree, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  async postTransaction(signedTx: any): Promise<string> {
    const url = `${this.nodeBaseURI}/transactions`;
    const response = await axios.post(url, signedTx, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }
}
