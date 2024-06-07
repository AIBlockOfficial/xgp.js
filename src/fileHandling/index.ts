const fs = require('fs');
import { ShardFile } from '../interfaces';

/** 
 * Helper function to split data into shards
 * 
 * @param data {Buffer} - The data to split
 * @param shardSize {number} - The size of each shard
 */
export function splitIntoShards(data: ShardFile, shardSize: number, byteMap: number[] | null = null): Uint8Array[] {
    const shards: Uint8Array[] = [];
    for (let i = 0; i < data.length; i += shardSize) {
        const shard = data.slice(i, i + shardSize);

        if (byteMap) {
            const convertedShard = toUint8Array(shard);
            const transformedData = transformData(convertedShard, byteMap);
            shards.push(transformedData.transformedMessage);
        } else {
            shards.push(toUint8Array(shard));
        }
    }

    return shards;
}

export function contractFromShards(shards: Uint8Array[], byteMap: number[]): ShardFile {
    return Buffer.concat(shards.map(shard => {
        return Buffer.from(reverseTransformData(shard, byteMap));
    }));
}

/**
 * Helper function to convert a Shard to a Uint8Array
 * 
 * @param shard {Shard} - The shard to convert
 */
function toUint8Array(input: Buffer | string): Uint8Array {
    if (typeof input === 'string') {
        const encoder = new TextEncoder();
        return encoder.encode(input);
    } else if (Buffer.isBuffer(input)) {
        return new Uint8Array(input);
    } else {
        throw new Error('Input must be a Buffer or a string');
    }
}

/**
 * Transforms a message using the public key
 * 
 * @param message {Uint8Array} - The message to encrypt
 * @param publicKey {Uint8Array} - The public key to encrypt the message with
 * @returns {Uint8Array} - The encrypted message
 */
function transformData(message: Uint8Array, byteMap: number[]) {
    const transformedMessage = new Uint8Array(message.map(byte => byteMap[byte]));

    return {
        transformedMessage,
        byteMap
    }
}

/**
 * Reverses the transformation of a message using the public key
 * 
 * @param message {Uint8Array} - The message to decrypt
 * @param publicKey {Uint8Array} - The public key to decrypt the message with
 * @returns {Uint8Array} - The decrypted message
 */
function reverseTransformData(message: Uint8Array, inverseByteMap: number[]) {
    return new Uint8Array(message.map(byte => inverseByteMap[byte]));
}

/**
 * Splits a file at a path into shards and returns them
 * 
 * @param filePath {string} - The path to the file to shard
 */
export function shardFile(filePath: string, byteMap: number[] | null = null): Uint8Array[] {
    const data = fs.readFileSync(filePath);
    return splitIntoShards(data, 100, byteMap);
}

/**
 * Reads a file and returns its contents as a buffer.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<Buffer>} - A promise that resolves with the file contents as a buffer.
 */
export function readdirAsync(folderPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

/**
 * Reads a file and returns its contents as a buffer.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<Buffer>} - A promise that resolves with the file contents as a buffer.
 */
export function statAsync(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if (err) {
                reject(err);
            } else {
                resolve(stats);
            }
        });
    });
}