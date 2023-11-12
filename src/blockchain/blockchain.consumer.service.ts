import { Process, Processor } from '@nestjs/bull';
import {
  Amount,
  Box,
  ErgoAddress,
  Network,
  OutputBuilder,
  TransactionBuilder,
} from '@fleet-sdk/core';
import { Configuration, DefaultApiFactory } from '../explorerApi';
import {
  EXPLORER_API_URL,
  isMainnet,
  NODE_API_URL,
  UMAP_MNEMONIC,
} from '../api/env';
import { Job } from 'bull';
import { NodeApi } from '../nodeApi/api';
import {
  ErgoTransactionInput,
  ErgoTransactionOutput,
} from '../types/nodeApi.dto';
import { convertToErgoTransactionOutput } from '../adapters/node';
import { BackendWallet } from '../api/rust/BackendWallet';
import { SendTxJob } from '../types/job.dto';

@Processor('tx-queue')
export class BlockchainConsumerService {
  private readonly explorerConf = new Configuration({
    basePath: EXPLORER_API_URL(isMainnet()),
  });

  private readonly explorerClient = DefaultApiFactory(this.explorerConf);
  private readonly nodeClient = new NodeApi(NODE_API_URL(isMainnet()));

  private readonly umapMnemonic: string = UMAP_MNEMONIC();
  private readonly umapWallet = new BackendWallet(
    this.umapMnemonic,
    '',
    isMainnet() ? Network.Mainnet : Network.Testnet,
  );

  private readonly MIN_BOX_VALUE: bigint = BigInt(1000000);
  private readonly MIN_TX_FEE: bigint = BigInt(1100000);

  private readonly umapAddress: string = this.umapWallet.getAddress(0);

  @Process({ name: '*', concurrency: 1 })
  async processJob(job: Job<unknown>) {
    switch (job.name) {
      case 'send-tx':
        return this.sendTx(job as Job<SendTxJob>);
    }
  }

  async sendTx(job: Job<SendTxJob>): Promise<void> {
    const address = job.data.recipient;
    const amount = job.data.amount;

    if (!ErgoAddress.validate(address)) {
      console.log('incorrect address provided');
      return;
    }

    const inputs = await this.getInputs(
      this.MIN_TX_FEE + amount,
      this.umapAddress,
    );

    const output = new OutputBuilder(amount, address);

    try {
      const unsignedTx = await this.generateUnsignedTransaction(
        inputs,
        output,
        this.umapAddress,
      );

      const signedTx = await this.umapWallet.signTransaction(
        unsignedTx,
        this.explorerClient,
        0,
      );

      const hash = await this.submitTransaction(signedTx);

      console.log('hash:', hash);

      // ideally this should be written to db where app listens to a write
    } catch (e) {
      console.log('error');
      console.log(e);
    }
  }

  private async getInputs(
    targetAmount: bigint,
    walletAddress: string,
  ): Promise<Box<Amount>[]> {
    const inputs: Box<Amount>[] = [];
    let currentSum = BigInt(0);
    const zengateErgoTree = ErgoAddress.fromBase58(walletAddress).ergoTree;

    const unconfirmedBoxesRes =
      await this.nodeClient.getTransactionsUnconfirmedByErgoTree(
        zengateErgoTree,
      );
    const unconfirmedInputs: ErgoTransactionInput[] = unconfirmedBoxesRes
      .map((tx) => tx.inputs)
      .flat();
    const unconfirmedOutputs: ErgoTransactionOutput[] = unconfirmedBoxesRes
      .map((tx) => tx.outputs)
      .flat()
      .filter(
        (output) =>
          output.ergoTree === zengateErgoTree &&
          !unconfirmedInputs.some((input) => input.boxId === output.boxId),
      );

    const unspentBoxes: ErgoTransactionOutput[] = (
      await this.nodeClient.getBoxesUnspentByAddress(walletAddress)
    )
      .map(convertToErgoTransactionOutput)
      .filter(
        (box) => !unconfirmedInputs.some((input) => input.boxId === box.boxId),
      );

    const walletInputs = [...unspentBoxes, ...unconfirmedOutputs];

    walletInputs.sort((a, b) => {
      return BigInt(a.value) > BigInt(b.value)
        ? -1
        : BigInt(a.value) < BigInt(b.value)
        ? 1
        : 0;
    });

    for (let i = 0; i < walletInputs.length; i++) {
      currentSum += BigInt(walletInputs[i].value);
      inputs.push(walletInputs[i] as unknown as Box<Amount>);
      if (currentSum >= targetAmount) {
        break;
      }
    }

    return inputs;
  }

  private async generateUnsignedTransaction(
    input: Box<Amount> | Box<Amount>[],
    output: OutputBuilder | OutputBuilder[],
    changeAddress: string,
    fee: bigint = this.MIN_TX_FEE,
  ): Promise<any> {
    const creationHeight = await this.getCreationHeight();
    return new TransactionBuilder(creationHeight)
      .from(input)
      .to(output)
      .sendChangeTo(changeAddress)
      .payFee(fee)
      .build()
      .toEIP12Object();
  }
  private async getCreationHeight(): Promise<number> {
    return (await this.explorerClient.getApiV1Blocks()).data.items?.[0].height;
  }

  private async submitTransaction(signedTransaction: any): Promise<string> {
    return await this.nodeClient.postTransaction(signedTransaction);
  }
}
