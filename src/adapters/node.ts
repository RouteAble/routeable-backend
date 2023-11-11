import { BlockchainOutput, ErgoTransactionOutput } from '../types/nodeApi.dto';

export function convertToErgoTransactionOutput(
  blockchainOutput: BlockchainOutput,
): ErgoTransactionOutput {
  return {
    boxId: blockchainOutput.boxId,
    value: blockchainOutput.value, // convert bigint to number
    ergoTree: blockchainOutput.ergoTree,
    creationHeight: blockchainOutput.creationHeight,
    assets: blockchainOutput.assets,
    additionalRegisters: blockchainOutput.additionalRegisters,
    transactionId: blockchainOutput.transactionId,
    index: blockchainOutput.index,
    spentTransactionId: blockchainOutput.spentTransactionId,
  };
}
