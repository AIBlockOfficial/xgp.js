import { IGatewayConfig, ShardFile, IPinataResponse, IOnChainPinataMap, ESchema } from "../interfaces";
import { toUint8Array, uint8ArrayToStream } from "../fileHandling";
import KeyWallet from "../wallet";
import { constructAddress } from "@2waychain/2wayjs";
const pinataSDK = require('@pinata/sdk');

export class IPFSStorage {
    private keyWallet: KeyWallet;
    private pinataSDKClient: any;

    /**
     * Construct an IPFSStorage instance
     * 
     * @param config {IGatewayConfig} - The configuration object for the Gateway
     * @param keyWallet {KeyWallet} - The KeyWallet instance to use
     */
    constructor(config: IGatewayConfig, keyWallet: KeyWallet) {
        this.keyWallet = keyWallet;

        if (!config.pinataSDKKeys || !config.pinataSDKKeys.apiKey || !config.pinataSDKKeys.apiSecret) {
            throw new Error('Pinata API keys are required for IPFS storage');
        }

        this.pinataSDKClient = new pinataSDK(config.pinataSDKKeys.apiKey, config.pinataSDKKeys.apiSecret);
    }

    /**
     * Pushes data to IPFS
     * 
     * @param data {ShardFile} - The data to push to IPFS
     * @param byteMap {number[]} - The byte map to use for substitution
     * @param publicKey {Uint8Array} - The public key to mint the data to
     */
    async push(data: ShardFile, byteMap: number[], publicKey: Uint8Array) {
        console.log("Pushing data to IPFS");
        if (!this.isConnectedToPinata()) {
            throw new Error('Not connected to Pinata');
        }

        const arrayData = toUint8Array(data);
        const transformedData = arrayData.map(byte => byteMap[byte]);
        const readableStream = uint8ArrayToStream(transformedData);

        const options = {
            pinataMetadata: {
                name: constructAddress(publicKey, null).unwrapOr("default"),
                keyvalues: {
                    publicKey: publicKey.toString()
                }
            },
            pinataOptions: {
                cidVersion: 0
            }
        };
        
        try {
            const resp: IPinataResponse = await this.pinataSDKClient.pinFileToIPFS(readableStream, options);
    
            if (resp) {
                await this.mintPinataMap(resp, publicKey);
            }
        } catch (e) {
            console.error("Error pushing data to IPFS", e);
        }
    }

    async pull(ipfsHash: string, publicKey: Uint8Array) {
        console.log("Pulling data from IPFS");

        
    }

    /** Mints a Pinata map to AIBlock for later retrieval 
     * 
     * @param pinataResp {IPinataResponse} - The response from Pinata
     * @param publicKey {Uint8Array} - The public key to mint the map to
     */
    async mintPinataMap(pinataResp: IPinataResponse, publicKey: Uint8Array) {
        const pinataMap: IOnChainPinataMap = {
            ipfsHash: pinataResp.IpfsHash,
            timestamp: pinataResp.Timestamp,
            schema: ESchema.XGP_V1_IPFS_PINATA,
            address: constructAddress(publicKey, null).unwrapOr("default")
        };

        await this.keyWallet.mintToChain(pinataMap, publicKey, 1);
    }

    /** Checks if the Gateway is connected to Pinata */
    async isConnectedToPinata() {
        try {
            const resp = await this.pinataSDKClient.testAuthentication();
            return resp == "Congratulations! You are communicating with the Pinata API"!;
        } catch (e) {
            return false;
        }
    }
}