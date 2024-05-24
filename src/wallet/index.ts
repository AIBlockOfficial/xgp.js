import { Wallet } from '@2waychain/2wayjs';

export default class KeyWallet {
  private wallet: Wallet;
  private cacheKeys: Map<Uint8Array, Uint8Array>;
  private CONFIG = {
    mempoolHost: 'https://mempool.aiblock.ch',
    passphrase: '2waychain',
  };
  
  constructor() {
    this.wallet = new Wallet();
    this.cacheKeys = new Map();
  }

  async init(seedPhrase: string) {
    await this.wallet.fromSeed(seedPhrase, this.CONFIG);
  }

  generateKeypair() {
      const encryptedKeypairResp = this.wallet.getNewKeypair([]);

      if (encryptedKeypairResp.content) {
        const encryptedKeypair = encryptedKeypairResp.content.newKeypairResponse;

        if (encryptedKeypair) {
          const decryption = this.wallet.decryptKeypair(encryptedKeypair);
          return decryption.content?.decryptKeypairResponse;

        }
      }

      return null;
  }

  providePublicKey(): Uint8Array | null {
    // See if the cacheKeys has a public key
    if (this.cacheKeys.size > 0) {
      // Return the first public key
      return this.cacheKeys.keys().next().value;
    }

    // Generate a new keypair
    const keyPair = this.generateKeypair();
    if (keyPair) {
      this.cacheKeys.set(keyPair.publicKey, keyPair.secretKey);
      return keyPair.publicKey;
    }

    return null;
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