import { IKeypairEncrypted } from "@2waychain/2wayjs";

export type ShardFile = Buffer | string;

export interface ICacheKeyValue {
    rawSecretKey: Uint8Array;
    encrypted: IKeypairEncrypted;
}

export interface IKeypairDecrypted {
    secretKey: Uint8Array;
    publicKey: Uint8Array;
}

export interface IOnChainShard {
    shardId: string;
    prev: string | null;
    schema: string;
    data: number[];
}

export interface IOnChainPinataMap {
    ipfsHash: string;
    timestamp: string;
    schema: string;
    address: string;
}

export interface IOnChainDynamoDBMap {
    tableName: string;
    itemName: string;
    schema: string;
    address: string;
}

export interface IItem {
    amount: number;
    metadata: any;
    address: string;
}

export enum ESchema {
    XGP_V1 = 'xgp_v1',                          // Generic XGP schema
    XGP_V1_BM = 'xgp_v1_bm',                    // Byte map schema
    XGP_V1_SHARD = 'xgp_v1_shard',              // Shard schema
    XGP_V1_IPFS_PINATA = 'xgp_v1_ipfs_pinata',  // Pinata schema for IPFS
    XGP_V1_DYNAMODB = 'xgp_v1_dynamodb'         // DynamoDB schema
}

//========== GATEWAY INTERFACES ==========//

export enum StorageService {
    IPFS = 'IPFS',
    S3 = 'S3',
    AIBLOCK = 'AIBLOCK',
    DYNAMODB = 'DYNAMODB'
}

export interface IGatewayConfig {
    fileSizeLimit: number;
    maxShards: number;
    maxShardSize: number;
    storageService: StorageService;
    pinataSDKKeys?: {
        apiKey: string;
        apiSecret: string;
    };
    awsSDKKeys?: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
    };
}

export interface IGatewayConfigOptional {
    fileSizeLimit?: number;
    maxShards?: number;
    maxShardSize?: number;
    storageService?: StorageService;
}

export interface IPinataResponse {
    IpfsHash: string,
    PinSize: string,
    Timestamp: string
}
