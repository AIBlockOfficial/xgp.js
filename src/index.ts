import KeyWallet from './wallet';
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
     * Transforms a message using the public key
     * 
     * @param message {Uint8Array} - The message to encrypt
     * @param publicKey {Uint8Array} - The public key to encrypt the message with
     * @returns {Uint8Array} - The encrypted message
     */
    transformMessage(message: Uint8Array, publicKey: Uint8Array) {
        const byteMap = this.createByteMapFromPublicKey(publicKey);
        return new Uint8Array(message.map(byte => byteMap[byte]));
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
     * Reverses the transformation of a message using the public key
     * 
     * @param message {Uint8Array} - The message to decrypt
     * @param publicKey {Uint8Array} - The public key to decrypt the message with
     * @returns {Uint8Array} - The decrypted message
     */
    reverseTransformMessage(message: Uint8Array, publicKey: Uint8Array) {
        const byteMap = this.createByteMapFromPublicKey(publicKey);
        const inverseByteMap = this.createInverseByteMap(byteMap);
        return new Uint8Array(message.map(byte => inverseByteMap[byte]));
    }
}