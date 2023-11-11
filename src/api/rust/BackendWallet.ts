import {
  BlockHeaders,
  DerivationPath,
  ErgoBoxes,
  ErgoStateContext,
  ExtSecretKey,
  Mnemonic,
  PreHeader,
  SecretKey,
  SecretKeys,
  UnsignedTransaction,
  Wallet,
} from 'ergo-lib-wasm-nodejs';
import { Network } from '@fleet-sdk/core';
import {
  EIP12UnsignedTransaction,
  SignedTransaction,
} from '@fleet-sdk/common/src/types/transactions';
export class BackendWallet {
  private readonly walletMnemonic: string;
  private readonly walletPassword: string = '';
  private readonly network: Network = Network.Mainnet;
  constructor(
    walletMnemonic: string,
    walletPassword?: string,
    network?: Network,
  ) {
    this.walletMnemonic = walletMnemonic;
    if (walletPassword) {
      this.walletPassword = walletPassword;
    }
    if (network) {
      this.network = network;
    }
  }

  getAddress(index: number): string {
    const sk = this.getExtendedSecretKey(index);
    return sk.public_key().to_address().to_base58(this.getRustNetwork());
  }

  async signTransaction(
    unsignedTransaction: EIP12UnsignedTransaction,
    explorerClient: any,
    index: number | number[] = 0,
  ): Promise<SignedTransaction> {
    const sks = new SecretKeys();
    if (typeof index === 'number') {
      const sk = this.getExtendedSecretKey(index);
      const dlogSecret = SecretKey.dlog_from_bytes(sk.secret_key_bytes());
      sks.add(dlogSecret);
    } else {
      const dlogSecretArr = index
        .map((i) => this.getExtendedSecretKey(i))
        .map((sk) => SecretKey.dlog_from_bytes(sk.secret_key_bytes()));
      dlogSecretArr.forEach((d) => sks.add(d));
    }

    const wallet = Wallet.from_secrets(sks);
    const ctx = await this.getErgoStateContext(explorerClient);
    return JSON.parse(
      wallet
        .sign_transaction(
          ctx,
          UnsignedTransaction.from_json(JSON.stringify(unsignedTransaction)),
          ErgoBoxes.from_boxes_json(unsignedTransaction.inputs),
          ErgoBoxes.from_boxes_json(unsignedTransaction.dataInputs),
        )
        .to_json(),
    ) as SignedTransaction;
  }

  private getRustNetwork(): number {
    return this.network === Network.Mainnet ? 0 : 16;
  }

  private getExtendedSecretKey(index: number) {
    const seed = Mnemonic.to_seed(this.walletMnemonic, this.walletPassword);
    const extendedSecretKey = ExtSecretKey.derive_master(seed);
    const path = DerivationPath.from_string(`m/44'/429'/0'/0/${index}`);
    return extendedSecretKey.derive(path);
  }

  private async getErgoStateContext(explorerClient): Promise<any> {
    const explorerHeaders = (
      await explorerClient.getApiV1BlocksHeaders()
    ).data.items.slice(0, 10);
    const block_headers = BlockHeaders.from_json(explorerHeaders);
    const pre_header = PreHeader.from_block_header(block_headers.get(0));
    return new ErgoStateContext(pre_header, block_headers);
  }
}
