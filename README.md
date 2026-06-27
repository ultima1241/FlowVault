# 💸 FlowVault

<div align="center">

[![CI](https://github.com/ultima1241/FlowVault/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ultima1241/FlowVault/actions/workflows/ci.yml)
[![Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet-7B61FF?logo=stellar&logoColor=white)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-SDK%20v25-zinc?logo=rust&logoColor=white)](https://soroban.stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E.svg)](LICENSE)

**Continuous linear token vesting and asset streaming on Stellar Testnet — built using Soroban smart contracts with verifiable on-chain inter-contract calls.**

🌐 **[Live Demo →](https://flowvault.usage-concur-tyke.workers.dev/)**

</div>

---

## 📋 Table of Contents

- [Project Description](#-project-description)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Smart Contracts (Testnet)](#-smart-contracts-testnet)
- [Inter-Contract Calls](#-inter-contract-calls)
- [Wallet Connection](#-wallet-connection-connect--disconnect)
- [Balance & Streaming Mechanics](#-balance--streaming-mechanics)
- [Error Handling](#-error-handling)
- [Screenshots](#-screenshots)
- [Setup Instructions](#-setup-instructions)
- [Testing](#-testing)
- [Commit History Summary](#-commit-history-summary)
- [License](#-license)

---

## 📖 Project Description

**FlowVault** is a premium, production-grade Stellar Soroban dApp that facilitates real-time continuous linear token vesting. Senders can lock custom `FVT` (FlowVault Token) utility assets into a custodian smart contract, which releases the funds linearly to a designated beneficiary over a specified vesting duration.

Beneficiaries can monitor their unlocked balance accruing smoothly in real time through a monospaced live ticking display, claiming matured tokens at any time. Senders also retain the option to revoke a vesting flow early—distributing already matured funds to the beneficiary and returning unvested capital to the depositor.

**Core Innovation**: The application operates with a fully on-chain inter-contract execution model. Capital deposits, withdrawals, and revocation splits are handled by making cross-contract calls from the `vesting_flow` contract to the `flow_token` contract.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      User Browser                         │
│                                                          │
│   ┌──────────────────────────────────────────────────┐  │
│   │            Next.js 14 Frontend (TypeScript)       │  │
│   │                                                  │  │
│   │  AccountConnector │ FlowInitiator │ VestingCard  │  │
│   │       FlowConsole │ AuditLog                     │  │
│   └──────────┬───────────────────────┬───────────────┘  │
│              │  Wallet Signing        │  Soroban RPC     │
│              ▼                        ▼                  │
│   ┌──────────────────┐    ┌──────────────────────────┐  │
│   │  Freighter / Kit │    │  stellar.ts (core)       │  │
│   │  (StellarWallets │    │  TransactionBuilder +    │  │
│   │   Kit v2.4)      │    │  server.simulateTx /     │  │
│   └──────────────────┘    │  server.sendTransaction  │  │
│                           └────────────┬─────────────┘  │
└────────────────────────────────────────┼────────────────┘
                                         │ HTTPS / RPC
                                         ▼
                               ┌─────────────────────┐
                               │   Stellar Testnet   │
                               │   (Soroban RPC)     │
                               └──────────┬──────────┘
                                          │
                            ┌─────────────┴──────────────┐
                            │                            │
                            ▼                            │
               ┌────────────────────────┐               │
               │ Vesting Flow Contract  │               │
               │   CC5ZFHGX2TR3...      │               │
               │                        │               │
               │  initiate_vesting() ───┼──┐            │
               │  claim_unlocked()   ───┼──┤  Inter-    │
               │  revoke_vesting()   ───┼──┤  Contract  │
               │  unlocked_balance()    │  │  Calls     │
               │  get_vesting_details() │  │            │
               │  fetch_user_flows()    │  │            │
               └────────────────────────┘  │            │
                                           ▼            │
               ┌────────────────────────────────────┐   │
               │ Flow Token Contract  (FVT Token)   │   │
               │   CBEUIKBQL4UB...                  │   │
               │                                    │   │
               │  transfer(from, to, amount) ◄──────┘   │
               │  balance(address)                       │
               │  mint(to, amount)  [admin only]         │
               └────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Smart Contracts | Rust + Soroban SDK | Protocol 25 |
| Contract Target | `wasm32v1-none` | – |
| Frontend Framework | Next.js (App Router) | 14.2.35 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^3.4.1 |
| Wallet Integration | `@creit.tech/stellar-wallets-kit` | ^2.4.0 |
| Freighter Direct API | `@stellar/freighter-api` | ^6.0.1 |
| Stellar SDK | `stellar-sdk` | ^13.3.0 |
| Animations | Framer Motion | ^12.41.0 |
| Icons | Lucide React | ^1.21.0 |
| Data Polling | SWR | ^2.4.2 |
| Deployment | Cloudflare Workers (static export) | – |
| CI/CD | GitHub Actions | – |

---

## 📜 Smart Contracts (Testnet)

| Contract | Address | Stellar Expert Link |
|---------|---------|---------------|
| **Token Contract** (`FVT`) | `CBEUIKBQL4UB6447O2DKVPPSXSNM6KLC3C5QT4GM3NF3KVJARH7IKJYT` | [View on Stellar Expert ↗](https://stellar.expert/explorer/testnet/contract/CBEUIKBQL4UB6447O2DKVPPSXSNM6KLC3C5QT4GM3NF3KVJARH7IKJYT) |
| **Vesting Flow Contract** | `CC5ZFHGX2TR3YBI4NUJFK3XZW6KTNQMYH7OCWYG4FTLMWNN3AWQLEF63` | [View on Stellar Expert ↗](https://stellar.expert/explorer/testnet/contract/CC5ZFHGX2TR3YBI4NUJFK3XZW6KTNQMYH7OCWYG4FTLMWNN3AWQLEF63) |

### Contract Addresses in Environment Config

```env
NEXT_PUBLIC_FVT_CONTRACT_ADDRESS=CBEUIKBQL4UB6447O2DKVPPSXSNM6KLC3C5QT4GM3NF3KVJARH7IKJYT
NEXT_PUBLIC_VESTING_FLOW_CONTRACT_ADDRESS=CC5ZFHGX2TR3YBI4NUJFK3XZW6KTNQMYH7OCWYG4FTLMWNN3AWQLEF63
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
```

---

## ⛓️ Inter-Contract Calls

Inter-contract invocation is the core technological mechanism of FlowVault. The `vesting_flow` contract calls functions on the custom `flow_token` contract directly on-chain using Soroban's typed contract client (`soroban_sdk::token::Client::new`).

### Technical Mechanism

#### 1. Locking deposit principal into custodian contract:
```rust
// In contracts/vesting_flow/src/lib.rs → initiate_vesting()
// Inter-contract call: pull principal from depositor into the current contract address
let token_client = soroban_sdk::token::Client::new(&env, &asset);
token_client.transfer(&depositor, &env.current_contract_address(), &principal);
```

#### 2. Releasing unlocked capital to beneficiary:
```rust
// In contracts/vesting_flow/src/lib.rs → claim_unlocked()
// Inter-contract call: push withdrawable vested amount from custodian to beneficiary
let token_client = soroban_sdk::token::Client::new(&env, &flow.asset);
token_client.transfer(
    &env.current_contract_address(),
    &flow.beneficiary,
    &withdrawable,
);
```

#### 3. Revoking flow (early cancellation splits):
```rust
// In contracts/vesting_flow/src/lib.rs → revoke_vesting()
// Inter-contract calls: vested portion goes to beneficiary, unvested principal returns to depositor
if to_beneficiary > 0 {
    token_client.transfer(&env.current_contract_address(), &flow.beneficiary, &to_beneficiary);
}
if to_depositor > 0 {
    token_client.transfer(&env.current_contract_address(), &flow.depositor, &to_depositor);
}
```

### Transaction Hash Evidence (Stellar Expert Verification)

| Action | Transaction Hash | Stellar Expert Link |
|--------|----------------|---------------------|
| **Deploy FVT Contract** | `b6efd6c60a3e448a59c69a04fdf1b0793c7cdb3e1220ddf29e62f33dae6b0e18` | [View ↗](https://stellar.expert/explorer/testnet/tx/b6efd6c60a3e448a59c69a04fdf1b0793c7cdb3e1220ddf29e62f33dae6b0e18) |
| **Initialize FVT Contract** | `396c46d65d836a99ea4725124fe363768df6d146624ce5320a314b829ca97a5f` | [View ↗](https://stellar.expert/explorer/testnet/tx/396c46d65d836a99ea4725124fe363768df6d146624ce5320a314b829ca97a5f) |
| **Deploy Vesting Contract** | `97e3f2c7b0cac717d53f4f1a6fddb45cf555ada60c0edc93bb3731ac835c3c67` | [View ↗](https://stellar.expert/explorer/testnet/tx/97e3f2c7b0cac717d53f4f1a6fddb45cf555ada60c0edc93bb3731ac835c3c67) |
| **initiate_vesting** (Flow #1) | `e590b71d35cc5e1fe6c7388186ad50b3005d03b997a367f985fa82db20c36fdf` | [View ↗](https://stellar.expert/explorer/testnet/tx/e590b71d35cc5e1fe6c7388186ad50b3005d03b997a367f985fa82db20c36fdf) |
| **claim_unlocked** (Flow #1) | `4fb16a3bed30ce9eb701b6673d539ace8511e1841712b542e811db68aa2bcf48` | [View ↗](https://stellar.expert/explorer/testnet/tx/4fb16a3bed30ce9eb701b6673d539ace8511e1841712b542e811db68aa2bcf48) |

---

## 🔑 Wallet Connection (Connect / Disconnect)

Multi-wallet support is driven by `@creit.tech/stellar-wallets-kit`, allowing users to connect their preferred wallets. **Freighter** is configured and tested as the primary path.

1. **Connection Modal**: Clicking "Connect Wallet" triggers `connectWallet()` which opens the wallet modal.
2. **Online Status**: The top navbar updates to show a truncated address (e.g. `GAVA...BXCM`) and a green pulsing status indicator.
3. **Wallet Disconnect**: Clicking "Disconnect" calls `disconnectWallet()`, wiping local React state and logging the user out.

---

## 📊 Balance & Streaming Mechanics

### FVT Balance Handling
- The client fetches FVT balances by simulating a call to the `balance` function on the Token contract.
- SWR polls the ledger balance every **8 seconds** and triggers instant re-validation on transactional success events.
- An admin-backed **"Mint 1000 FVT (Faucet)"** utility button allows users to fund their testnet accounts instantly.
  - **Faucet account (testnet only):** [`GAVAX3CT3G2XGKNXLMAP6R6IGRVQJHP6CBVOKNJVEWXONO2ZPQYPBXCM`](https://stellar.expert/explorer/testnet/account/GAVAX3CT3G2XGKNXLMAP6R6IGRVQJHP6CBVOKNJVEWXONO2ZPQYPBXCM) — this is a disposable Stellar **Testnet** account (the `FVT` token admin) used purely to make the demo self-serve. Its key is intentionally shipped in the client bundle so anyone can mint test tokens; it holds no real value and is not reused for any other purpose. Do **not** follow this pattern on mainnet.

### Vesting Calculation
- User flows are listed via `fetchUserFlows` and detailed via `getVestingFlowDetails`.
- Smooth real-time counting (every **100ms**) is animated client-side using chronological ledger offsets:
  $$elapsed = \max(0, \text{now} - \text{commencement})$$
  $$vested = elapsed \ge \text{period} ? \text{principal} : \frac{\text{principal} \times elapsed}{\text{period}}$$
- To minimize RPC strain, full on-chain status is only hard-polled every 8 seconds, keeping the ticking ticker light, accurate, and responsive.

---

## ⚠️ Error Handling

FlowVault implements rigorous exception handling covering three mandatory fallback screens:

1. **🔌 Wallet Not Installed / Not Found**:
   If Freighter or other adapters are missing, the UI displays:
   > *"Freighter extension not found. Please install Freighter from freighter.app to connect."*
2. **🚫 Signature Rejected by User**:
   If a user declines to sign a ledger transaction, the UI registers:
   > *"Signature request cancelled. No changes were made."*
3. **💰 Insufficient Network Balance**:
   Pre-validation safeguards run form checks to prevent gas wastage, and contract aborts display a clean message:
   > *"Insufficient balance to complete the transaction."*

---

## 📸 Screenshots

### Active Dashboard (FlowConsole) — Desktop View
![Desktop home page](screenshots/desctop%20home%20page%20.png)

### Mobile Layout View
![Mobile landing page](screenshots/mobile%20landingg%20page%20.png)
![Mobile home page](screenshots/mobile%20home%20page%20.png)

### Animated Walkthrough (Demo)
![Demo video](screenshots/demo%20video.gif)

### Cargo Test Output (15 passing tests)

```
running 4 tests
test test::metadata_matches_fvt_token ... ok
test test::transfer_rejects_insufficient_balance - should panic ... ok
test test::admin_can_mint_tokens ... ok
test test::transfer_moves_tokens_between_accounts ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

running 11 tests
test test::test_initiate_vesting_fails_for_zero_period - should panic ... ok
test test::test_initiate_vesting_fails_for_zero_principal - should panic ... ok
test test::test_self_flow_is_listed_only_once ... ok
test test::test_initiate_vesting_locks_deposit ... ok
test test::test_unlocked_balance_calculation ... ok
test test::test_revoke_vesting ... ok
test test::test_claim_transfers_unlocked_amount ... ok
test test::test_partial_claims_only_transfer_newly_unlocked_amount ... ok
test test::test_claim_requires_beneficiary_auth ... ok
test test::test_revoke_after_partial_claim_settles_remaining_funds ... ok
test test::test_fetch_user_flows_depositor_and_beneficiary ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s
```

---

## 🚀 Setup Instructions

### Prerequisites
- [Rust](https://rustup.rs/) (1.75+) with `cargo`
- [Node.js](https://nodejs.org/) (v20+) with `npm`
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli) 26.0.0+
- [Freighter Wallet](https://freighter.app/)

### 1. Clone & Install
```bash
git clone https://github.com/ultima1241/FlowVault.git
cd FlowVault

# Install dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Environment
Create `frontend/.env`:
```env
NEXT_PUBLIC_FVT_CONTRACT_ADDRESS=CBEUIKBQL4UB6447O2DKVPPSXSNM6KLC3C5QT4GM3NF3KVJARH7IKJYT
NEXT_PUBLIC_VESTING_FLOW_CONTRACT_ADDRESS=CC5ZFHGX2TR3YBI4NUJFK3XZW6KTNQMYH7OCWYG4FTLMWNN3AWQLEF63
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
```

### 3. Run Locally
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing

Both contracts are verified locally via workspace cargo runs.

### Run tests
```bash
cargo test
```

---

## 📝 Commit History Summary

This repository was compiled progressively following a 15-commit architectural layout:

| # | Commit Message |
|---|----------------|
| 1 | `chore: project scaffold and architectural layout routing` |
| 2 | `feat: flow token contract implementation` |
| 3 | `feat: vesting flow contract workspace configuration` |
| 4 | `feat: vesting flow contract implementation with inter-contract claim routing` |
| 5 | `test: implement 11 vesting flow contract unit tests` |
| 6 | `test: add vesting flow contract snapshots` |
| 7 | `chore: frontend project configuration and build settings` |
| 8 | `feat: core stellar utility integrations with stellar-wallets-kit` |
| 9 | `feat: implement AccountConnector, FlowInitiator, VestingCard, and AuditLog frontend UI components` |
| 10 | `feat: configure dedicated client state handling and live ticker polling` |
| 11 | `feat: build robust system error boundary components and loading fallbacks` |
| 12 | `feat: optimize mobile responsive layouts and breakpoint adaptations` |
| 13 | `ci: establish GitHub Actions workflow configuration` |
| 14 | `chore: testnet deployment + real contract addresses wired in` |
| 15 | `docs: README with full evidence (addresses, tx hashes, screenshots)` |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more details.
