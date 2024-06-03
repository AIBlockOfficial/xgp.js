# xgp.js
The eXtensible Gateway Protocol (XGP), written with ❤️ for JavaScript/TypeScript

..

## How to Use

XGP can be used to create substitution transformation for data/messages using a public key input. You can 
therefore produce content that is public key-secured and provably owned by the signatory. You can initialise and use it 
in the following way:

```typescript
import { Gateway } from '@2waychain/xgp';

// Init the Gateway
const SEED_PHRASE = "my string seed phrase";
const gateway = new Gateway();

// Set up some data
const data = "Some data to transform with XGP";

gateway.init(SEED_PHRASE)
    .then(() => {
        const publicKey = gateway.getPublicKey();
        const blockchainReadyData = gateway.transformData(data, publicKey);

        console.log("My data is ready for the blockchain", blockchainReadyData);
    });
```

..