const AWS = require('aws-sdk');
import KeyWallet from "../wallet";
import { constructAddress } from "@2waychain/2wayjs";
import { toUint8Array, bytesToHex } from "../fileHandling";
import { ESchema, IGatewayConfig, ShardFile } from "../interfaces";

export class DynamoDBStorage {
    private keyWallet: KeyWallet;
    private dynamoDBClient: any;

    /**
     * Construct a DynamoDBStorage instance
     * 
     * @param gatewayConfig {IGatewayConfig} - The configuration object for the Gateway
     * @param keyWallet {KeyWallet} - The KeyWallet instance to use
     */
    constructor(gatewayConfig: IGatewayConfig, keyWallet: KeyWallet) {
        this.keyWallet = keyWallet;

        if (!gatewayConfig.awsSDKKeys || !gatewayConfig.awsSDKKeys.accessKeyId || !gatewayConfig.awsSDKKeys.secretAccessKey) {
            throw new Error('AWS keys are required for DynamoDB storage');
        }

        AWS.config.update({
            accessKeyId: gatewayConfig.awsSDKKeys.accessKeyId,
            secretAccessKey: gatewayConfig.awsSDKKeys.secretAccessKey,
            region: gatewayConfig.awsSDKKeys.region
        });

        this.dynamoDBClient = new AWS.DynamoDB.DocumentClient();
    }

    /**
     * Pushes data to DynamoDB
     * 
     * @param data {ShardFile} - The data to push to DynamoDB
     * @param byteMap {number[]} - The byte map to use for substitution
     * @param publicKey {Uint8Array} - The public key to mint the data to
     */
    async push(data: ShardFile, params: any, byteMap: number[], publicKey: Uint8Array) {
        console.log("Pushing data to DynamoDB");
        if (!this.isConnectedToDynamoDB()) {
            throw new Error('Not connected to DynamoDB');
        }

        const arrayData = toUint8Array(data);
        const transformedData = arrayData.map(byte => byteMap[byte]);
        const hexValue = bytesToHex(transformedData);

        params.Item["data"] = hexValue;

        try {
            const resp = await this.dynamoDBClient.put(params);

            if (resp) {
                await this.mintDynamoDBMap(params, publicKey);
            }
        } catch (e) {
            console.error("Error pushing data to DynamoDB", e);
        }
    }

    async mintDynamoDBMap(params: any, publicKey: Uint8Array) {
        console.log("Minting DynamoDB map");

        const dynamoDBMap = {
            tableName: params.TableName,
            itemName: "itemName",
            schema: ESchema.XGP_V1_DYNAMODB,
            address: constructAddress(publicKey, null).unwrapOr("default"),
        };

        console.log("DynamoDB map", dynamoDBMap);
    }

    /**
     * Checks if the DynamoDB client is connected
     * 
     * @returns {boolean} - True if connected, false otherwise
     */
    isConnectedToDynamoDB() {
        return this.dynamoDBClient !== null;
    }
}