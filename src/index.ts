import KeyWallet from './wallet';
import { shardFile, readdirAsync, statAsync } from './fileHandling';

const readdir = require('bluebird').promisify(require('fs').readdir);
const { createHash } = require('sha256-uint8array');

export class Gateway {
    private keyWallet: KeyWallet;

    /**
     * Creates a new Gateway instance
     */
    constructor() {
        this.keyWallet = new KeyWallet();
    }

    /**
     * Initialize the Gateway with a seed phrase to handle key management
     * 
     * @param seedPhrase {string} - The seed phrase to initialize the wallet
     */
    async init(seedPhrase: string) {
        await this.keyWallet.init(seedPhrase);
    }

    /**
     * Generates a new key pair and returns the public key
     */
    getKeypair() {
        return this.keyWallet.provideKeypair();
    }

    /**
     * Deterministically generates a byte map from the public key
     * 
     * @returns {Uint8Array} - The public key
     */
    createByteMapFromPublicKey(publicKey) {
        // publicKey is assumed to be a Uint8Array
    
        // Hash the public key using SHA-256
        const hashArray = createHash().update(publicKey).digest();
    
        // Initialize the byte map array
        let byteMap = Array.from({length: 256}, (_, i) => i);
    
        // Simple Fisher-Yates shuffle algorithm with hash values as pseudo-randomness source
        for (let i = byteMap.length - 1; i > 0; i--) {
            // Use hash bytes cyclically and perform modulo operation to ensure it's within bounds
            let j = hashArray[i % hashArray.length] % (i + 1);
            [byteMap[i], byteMap[j]] = [byteMap[j], byteMap[i]];
        }
    
        return byteMap;
    }

    /**
     * Creates the inverse byte map of a given byte map, required for the reversion of data to 
     * its original form
     * 
     * @param byteMap {Array<number>} - The byte map to create the inverse of
     * @returns 
     */
    createInverseByteMap(byteMap) {
        // Initialize an array of the same length as the byteMap
        let inverseByteMap = new Array(256);
    
        // Populate the inverse map
        byteMap.forEach((value, index) => {
            inverseByteMap[value] = index;
        });
    
        return inverseByteMap;
    }

    /**
     * Mints a byte map to the chain
     * 
     * @param byteMap {Array}
     */
    async mint(byteMap: number[], publicKey: Uint8Array, amount: number) {
        await this.keyWallet.mintByteMapToChain(byteMap, publicKey, amount);
    }

    async push(folderPath: string, publicKey: Uint8Array | null = null) {
        if (!this.isNode()) {
            throw new Error('This method is only available in Node.js environments');
        }

        const path = require('path');
        const usedPublicKey = publicKey || this.getKeypair()?.publicKey;
        const byteMap = this.createByteMapFromPublicKey(usedPublicKey);
        let shardsToPush: Uint8Array[] = [];
        let prevHash = null;

        try {
            const files = await readdirAsync(folderPath);
            console.log("Files", files);
    
            for (const file of files) {
                const filePath = path.join(folderPath, file);
    
                const stats = await statAsync(filePath);
    
                if (stats.isDirectory()) {
                    await this.push(filePath);
                } else if (stats.isFile()) {
                    const shards = shardFile(filePath, byteMap);
                    shardsToPush.push(...shards);
                }
            }
    
            if (usedPublicKey) {
                for (let i = 0; i < shardsToPush.length; i++) {
                    const shard = shardsToPush[i];
    
                    try {
                        const resp: any = await this.keyWallet.mintShardToChain(shard, prevHash, i, usedPublicKey, 1);

                        if (resp) {
                            prevHash = resp.tx_hash;
                        }
                    } catch (err) {
                        console.error("Error minting shard", err);
                    }
                }
            } else {
                console.log("No public key found. Unable to push to chain");
                throw new Error('No public key found. Unable to push to chain');
            }
        } catch (err) {
            console.error(`Error processing folder ${folderPath}:`, err);
        }
    }

    isNode() {
        return typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
    }
}