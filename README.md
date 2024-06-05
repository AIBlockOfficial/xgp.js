<div align="center">
  <a>
    <img src="https://github.com/AIBlockOfficial/xgp.js/blob/main/assets/hero.jpg" alt="Logo" style="width:100%;max-width:700px">
  </a>

  <h2 align="center">xgp.js</h2> <div style="height:30px"></div>
<!-- 
  <div>
  <img src="https://img.shields.io/github/actions/workflow/status/AIBlockOfficial/Chain/.github/workflows/rust.yml?branch=main" alt="Pipeline Status" style="display:inline-block"/>
  <img src="https://img.shields.io/crates/v/tw_chain" alt="Cargo Crates Version" style="display:inline-block" />
  </div> -->

  <p align="center">
    The eXtensible Gateway Protocol (XGP), written with ❤️ for JavaScript/TypeScript
    <br />
    <br />
    <a href="https://aiblock.dev"><strong>Official documentation »</strong></a>
    <br />
    <br />
  </p>
</div>

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