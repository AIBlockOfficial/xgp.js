import { Wallet } from '@2waychain/2wayjs';

export default class KeyWallet {
  private wallet: Wallet;
  private CONFIG = {
    mempoolHost: 'https://mempool.aiblock.ch',
    passphrase: '2waychain',
  };
  
  constructor() {
    this.wallet = new Wallet();
  }

  async init(seedPhrase: string) {
    await this.wallet.fromSeed(seedPhrase, this.CONFIG);
  }

  providePublicKey() {
    
  }

  encryptWithPublicKey(publicKey: string, message: string) {

  }

  decryptWithPrivateKey(privateKey: string, message: string) {

  }

  signChallenge(message: string, publicKey: string) {

  }

  createChallenge() {

  }
}