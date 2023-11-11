import { RegisterType } from '../explorerApi';

export interface ErgoTransaction {
  dataInputs: Array<ErgoTransactionDataInput>;
  id: string;
  inputs: Array<ErgoTransactionInput>;
  outputs: Array<ErgoTransactionOutput>;
  size: number;
}

export interface ErgoTransactionInput {
  boxId: string;
  spendingProof: SpendingProof;
  extension: Extension;
}

export interface SpendingProof {
  proofBytes: string;
  extension: Extension;
}

export interface Extension {
  [key: string]: string;
}

export interface ErgoTransactionDataInput {
  boxId: string;
  extension: Extension;
}

export interface ErgoTransactionOutput {
  boxId: string;
  value: bigint;
  ergoTree: string;
  creationHeight?: number;
  assets: Array<Asset>;
  additionalRegisters: Registers;
  transactionId: string;
  index: number;
  spentTransactionId?: string;
}

export interface Asset {
  tokenId: string;
  amount: bigint;
}

export type Registers = Partial<Record<RegisterType, string>>;

export interface BlockchainOutput {
  globalIndex: number;
  inclusionHeight: number;
  address: string;
  spentTransactionId?: string;
  boxId: string;
  value: bigint;
  ergoTree: string;
  assets: Array<Asset>;
  creationHeight: number;
  additionalRegisters: Registers;
  transactionId: string;
  index: number;
}
