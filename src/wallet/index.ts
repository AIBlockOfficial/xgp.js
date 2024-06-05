import { Wallet } from '@2waychain/2wayjs';
import { ICacheKeyValue, IOnChainShard, IKeypairDecrypted } from '../interfaces';

export default class KeyWallet {
  private wallet: Wallet;
  private cacheKeys: Map<Uint8Array, ICacheKeyValue>;
  private CONFIG = {
    mempoolHost: 'https://mempool.aiblock.ch',
    passphrase: '2waychain',
  };

  constructor() {
    this.wallet = new Wallet();
    this.cacheKeys = new Map();
  }

  /**
   * Initialises a wallet with a seed phrase
   * 
   * @param seedPhrase {string} - The seed phrase to initialise the wallet
   */
  async init(seedPhrase: string) {
    await this.wallet.fromSeed(seedPhrase, this.CONFIG);
  }

  /**
   * Generates a keypair and returns the raw secret and public keys, along with the encrypted keypair 
   * for wallet handling
   */
  generateKeypair() {
    const encryptedKeypairResp = this.wallet.getNewKeypair([]);

    if (encryptedKeypairResp.content) {
      const encryptedKeypair = encryptedKeypairResp.content.newKeypairResponse;

      if (encryptedKeypair) {
        const decryption = this.wallet.decryptKeypair(encryptedKeypair);

        if (decryption.content) {
          return {
            raw: decryption.content.decryptKeypairResponse,
            encrypted: encryptedKeypair
          };
        }

      }
    }

    return null;
  }

  /**
   * Provides a keypair from the cacheKeys, or generates a new one if none exists
   */
  provideKeypair(): IKeypairDecrypted | null {
    // See if the cacheKeys has a public key
    if (this.cacheKeys.size > 0) {
      // Return the first public key
      return this.cacheKeys.keys().next().value;
    }

    // Generate a new keypair
    const keyPair = this.generateKeypair();
    if (keyPair && keyPair.raw && keyPair.encrypted) {

      this.cacheKeys.set(keyPair.raw.publicKey, {
        rawSecretKey: keyPair.raw.secretKey,
        encrypted: keyPair.encrypted
      });

      return {
        secretKey: keyPair.raw.secretKey, 
        publicKey: keyPair.raw.publicKey
      };
    }

    return null;
  }

  /**
   * Mint a shard to the chain
   * 
   * @param shard {Uint8Array} - The shard to mint to the chain
   * @param prevHash {string} - The previous hash of the shard
   * @param shardId {number} - The shard ID
   * @param publicKey {Uint8Array} - The public key to mint the shard to
   * @param amount {number} - The amount of shards to mint
   */
  async mintShardToChain(shard: Uint8Array, prevHash: string | null, shardId: number, publicKey: Uint8Array, amount: number) {
    const keypair = this.cacheKeys.get(publicKey);
    if (!keypair) {
      return {
        success: false,
        message: "No secret key found for the public key"
      }
    }

    const onChainShard: IOnChainShard = {
      shardId,
      prev: prevHash,
      schema: 'xgp_v1',
      data: Array.from(shard)
    };

    const encryptedKeypair = keypair.encrypted;
    const createItemResp = await this.wallet.createItems(encryptedKeypair, false, amount, JSON.stringify(onChainShard));

    return createItemResp.content ? createItemResp.content.createItemResponse : createItemResp;
  }

  /**
   * Mint a bytemap item to the chain
   * 
   * @param byteMap {number[]} - The byte map to mint to the chain
   * @param publicKey {Uint8Array} - The public key to mint the item to
   * @param amount {number} - The amount of items to mint
   */
  async mintByteMapToChain(byteMap: number[], publicKey: Uint8Array, amount: number) {
    const metadata = {
      schema: "xgp_v1",
      byteMap
    };

    const keypair = this.cacheKeys.get(publicKey);
    if (!keypair) {
      return {
        success: false,
        message: "No secret key found for the public key"
      }
    }

    const encryptedKeypair = keypair.encrypted;
    const createItemResp = await this.wallet.createItems(encryptedKeypair, false, amount, JSON.stringify(metadata));

    return createItemResp.content ? createItemResp.content.createItemResponse : createItemResp;
  }
}