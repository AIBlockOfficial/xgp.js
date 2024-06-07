import axios from 'axios';
import { contractFromShards, splitIntoShards } from "../fileHandling";
import { ShardFile, IItem, ICacheKeyValue } from "../interfaces";
import KeyWallet from "../wallet";
import { constructAddress } from '@2waychain/2wayjs';

export class AIBlockStorage {
    private shardSize: number;
    private keyWallet: KeyWallet;

    /** Construct an AIBlockStorage instance */
    constructor(shardSize: number, keyWallet: KeyWallet) {
        this.shardSize = shardSize;
        this.keyWallet = keyWallet;
    }

    /**
     * Pushes data to the AIBlock storage
     * 
     * @param data {ShardFile} - The data to push to the AIBlock storage
     * @param shardId {string} - The shard ID to assign to the data
     * @param byteMap {number[]} - The byte map to use for sharding
     * @param publicKey {Uint8Array} - The public key to mint the data to
     * @param mintAmount {number} - The amount to mint for each shard
     */
    async push(data: ShardFile, shardId: string, byteMap: number[], publicKey: Uint8Array, mintAmount: number = 1) {
        const shards = splitIntoShards(data, this.shardSize, byteMap);
        let prevHash = null;

        for (let i = 0; i < shards.length; i++) {
            const shard = shards[i];

            try {
                const resp: any = await this.keyWallet.mintShardToChain(shard, prevHash, shardId, publicKey, mintAmount);

                if (resp) {
                    prevHash = resp.tx_hash;
                }
            } catch (err) {
                console.error("Error minting shard", err);
            }
        }
    }

    /**
     * Pulls data from the AIBlock storage
     * 
     * @param shardId {string} - The shard ID to pull from
     * @param createByteMapFromPublicKey {Function} - The function to create a byte map from a public key
     * @param createInverseByteMap {Function} - The function to create an inverse byte map
     * @param publicKeys {Uint8Array[]} - The public keys to pull the data from
     */
    async pull(shardId: string, createByteMapFromPublicKey: Function, createInverseByteMap: Function, publicKeys: Uint8Array[]) {
        const itemMaps = await Promise.all(publicKeys.map(async (publicKey) => await this.fetchAllItems(this.keyWallet.cacheKeys, publicKey)));
        const shards: IItem[] = [];
        let byteMap: number[] = [];

        // Collect shards for the given shardId
        for (let i = 0; i < itemMaps.length; i++) {
            const items = itemMaps[i];
            const publicKey = publicKeys[i];

            for (const itemData of Array.from(items.values())) {
                if (itemData.metadata.shardId == shardId) {
                    if (byteMap.length == 0) {
                        byteMap = createByteMapFromPublicKey(publicKey);   
                    }

                    if (!shards.length) {
                        shards.push(itemData);
                    } else {
                        // Insert a shard in the correct position
                        for (let i = shards.length - 1; i > 0; i--) {
                            if (itemData.metadata.prev == shards[i].metadata.genesisHash) {
                                shards.splice(i, 0, itemData);
                                break;
                            }
                        }
                    }
                }
            }
        }

        const inverseByteMap = createInverseByteMap(byteMap);
        return contractFromShards(shards.map(shard => shard.metadata.data), inverseByteMap);
    }

    /**
     * Fetches all items from the AIBlock storage
     * 
     * @param cacheKeys {Map<Uint8Array, ICacheKeyValue>} - The cache keys to fetch the items from
     * @param publicKey {Uint8Array} - The public key to fetch the items for
     */
    async fetchAllItems(cacheKeys: Map<Uint8Array, ICacheKeyValue>, publicKey: Uint8Array | null = null) {
        const addresses = publicKey ? [constructAddress(publicKey, null).unwrapOr("")] : Array.from(cacheKeys.keys()).map((pk: Uint8Array) => constructAddress(pk, null).unwrapOr(''));
        const balances = await this.keyWallet.fetchBalance(addresses);

        if (balances && balances.content) {
            const finalBalances: any = balances.content.fetchBalanceResponse;
            let items: Map<string, IItem> = new Map();

            if (finalBalances && finalBalances.address_list) {
                for (const address of Object.keys(finalBalances.address_list)) {
                    const addressEntry = finalBalances.address_list[address];

                    // TODO: This approach will not work if multiple addresses have items with the same genesis hash
                    // Need to consider how to pull items in this edge case
                    for (const item of addressEntry) {
                        if (item.value && item.value.hasOwnProperty('Item')) {
                            items.set(item.value.Item.genesis_hash, {
                                amount: item.value.Item.amount,
                                metadata: JSON.parse(item.value.Item.metadata),
                                address: address
                            });
                        }
                    }
                }
            }

            return items;
        }

        console.error("Error fetching balances");
        return new Map();
    }
}