import { MOutputInfo, OutputInfo, RegisterType } from '../explorerApi';
import { ErgoTransactionOutput, Registers } from '../types/nodeApi.dto';

/* eslint-disable  @typescript-eslint/no-non-null-assertion */

export function outputInfoToErgoTransactionOutput(
  output: OutputInfo | MOutputInfo,
): ErgoTransactionOutput {
  return {
    boxId: output.boxId,
    value: BigInt(output.value),
    ergoTree: output.ergoTree,
    creationHeight: output.creationHeight,
    assets: output.assets!.map((token) => ({
      tokenId: token.tokenId,
      amount: token.amount,
    })),
    additionalRegisters: (
      Object.keys(output.additionalRegisters) as RegisterType[]
    ).reduce(
      (
        obj: Partial<Record<RegisterType, string>>,
        key: RegisterType,
      ): Registers => {
        if (output.additionalRegisters[key]) {
          obj[key] = output.additionalRegisters[key]?.serializedValue;
        }
        return obj;
      },
      {} as Partial<Record<RegisterType, string>>,
    ),
    transactionId: output.transactionId,
    index: output.index,
    spentTransactionId: output.spentTransactionId,
  };
}
