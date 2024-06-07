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

export interface IItem {
    amount: number;
    metadata: any;
    address: string;
}

export enum ESchema {
    XGP_V1 = 'xgp_v1',              // Generic XGP schema
    XGP_V1_BM = 'xgp_v1_bm',        // Byte map schema
    XGP_V1_SHARD = 'xgp_v1_shard'   // Shard schema
}

//========== GATEWAY INTERFACES ==========//

export enum StorageService {
    IPFS,
    S3,
    AIBLOCK
}

export interface IGatewayConfig {
    fileSizeLimit: number;
    maxShards: number;
    maxShardSize: number;
    storageService: StorageService;   
}

export interface IGatewayConfigOptional {
    fileSizeLimit?: number;
    maxShards?: number;
    maxShardSize?: number;
    storageService?: StorageService;
}