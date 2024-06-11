const fs = require('fs');
import KeyWallet from './wallet';
import { StorageService, IGatewayConfig, IGatewayConfigOptional } from './interfaces';
import { AIBlockStorage, IPFSStorage, DynamoDBStorage } from './storage';
const { createHash } = require('sha256-uint8array');

/// Default configuration for the Gateway
const DEFAULT_CONFIG: IGatewayConfig = {
    fileSizeLimit: 1024,
    maxShards: 10,
    maxShardSize: 200,
    storageService: StorageService.AIBLOCK,
};

export class Gateway {
    private keyWallet: KeyWallet;
    private config: IGatewayConfig;
    private aiBlockStorage: AIBlockStorage;
    private ipfsStorage: IPFSStorage;
    private dynamoDBStorage: DynamoDBStorage;

    /**
     * Creates a new Gateway instance
     * 
     * @param config {IGatewayConfig} - The configuration object for the Gateway
     */
    constructor(config: IGatewayConfigOptional | null = null) {
        this.keyWallet = new KeyWallet();
        this.config = config ? Object.assign(DEFAULT_CONFIG, config) : DEFAULT_CONFIG;

        // Storage services
        this.aiBlockStorage = new AIBlockStorage(this.config.maxShardSize, this.keyWallet);
        this.ipfsStorage = new IPFSStorage(this.config, this.keyWallet);
        this.dynamoDBStorage = new DynamoDBStorage(this.config, this.keyWallet);
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
        let byteMap = Array.from({ length: 256 }, (_, i) => i);

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
    async mintByteMap(byteMap: number[], publicKey: Uint8Array, amount: number) {
        await this.keyWallet.mintByteMapToChain(byteMap, publicKey, amount);
    }

    /**
     * Reads a file and returns its contents as a buffer.
     * @param {string} filePath - The path to the file.
     * @returns {Promise<Buffer>} - A promise that resolves with the file contents as a buffer.
     */
    async readFileAsBuffer(filePath: string): Promise<Buffer> {
        if (!this.isNode()) {
            throw new Error('This method is only available in Node.js environments');
        }

        return new Promise((resolve, reject) => {
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    return reject(`Error checking file: ${err.message}`);
                }
                if (!stats.isFile()) {
                    return reject(`The path provided is not a file: ${filePath}`);
                }
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        return reject(`Error reading file: ${err.message}`);
                    }
                    resolve(data);
                });
            });
        });
    }

    /**
     * Pushes a data file to the chain
     * 
     * @param data {Buffer} - The data buffer to push
     * @param fileId {string} - The ID of the file
     * @param publicKey {Uint8Array} - The public key to mint the shard to
     */
    async push(data: Buffer, fileId: string, publicKey: Uint8Array | null = null) {
        const usedPublicKey = this.keyWallet.robustlyFetchPublicKey(publicKey)[0];
        const byteMap = this.createByteMapFromPublicKey(usedPublicKey);
        
        if (usedPublicKey) {
            // Push the file to the chain
            switch (this.config.storageService) {
                case StorageService.AIBLOCK: {
                    await this.aiBlockStorage.push(data, fileId, byteMap, usedPublicKey);
                    break;
                }
                case StorageService.IPFS: {
                    await this.ipfsStorage.push(data, byteMap, usedPublicKey);
                    break;
                }
                case StorageService.DYNAMODB: {
                    const params = {
                        TableName: 'default',
                        Item: {
                            "data": "default"
                        }
                    };

                    await this.dynamoDBStorage.push(data, params, byteMap, usedPublicKey);
                }
                default: {
                    this.shouldBeUnreachable(this.config.storageService);
                }
                    
            }
        }
    }

    /**
     * Pulls a data file from the chain
     * 
     * @param fileId {string} - The ID of the shard to pull
     * @param publicKey {Uint8Array} - The public key to pull the shard from
     */
    async pull(fileId: string, publicKey: Uint8Array | null = null) {
        const publicKeysToPull = this.keyWallet.robustlyFetchPublicKey(publicKey);

        switch (this.config.storageService) {
            case StorageService.AIBLOCK:
                return await this.aiBlockStorage.pull(fileId, this.createByteMapFromPublicKey, this.createInverseByteMap, publicKeysToPull);
            default:
                throw new Error('Unsupported storage service');
        }
    }

    shouldBeUnreachable(value: string) {}

    /** Determines whether the current execution environment is NodeJS or not */
    isNode() {
        return typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
    }
}