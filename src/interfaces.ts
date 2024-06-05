import { IKeypairEncrypted } from "@2waychain/2wayjs";

export type Shard = Buffer | string;

export interface ICacheKeyValue {
    rawSecretKey: Uint8Array;
    encrypted: IKeypairEncrypted;
}

export interface IKeypairDecrypted {
    secretKey: Uint8Array;
    publicKey: Uint8Array;
}

export interface IOnChainShard {
    shardId: number;
    prev: string | null;
    schema: string;
    data: number[];
}

//========== GATEWAY INTERFACES ==========//

export enum StorageService {
    IPFS,
    S3,
    AIBLOCK
}

export interface IGatewayConfig {
    fileSizeLimit: number | null;
    maxShards: number | null;
    maxShardSize: number | null;
    storageService: StorageService;
    
}