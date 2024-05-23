import KeyWallet from './wallet';

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
}