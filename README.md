# 🏛️ Obelisk — Humanity Archive System
> **Decentralized Cryptographic Social Protocol & Proof-of-Humanity Backend Architecture**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=flat-square&logo=solidity)](https://soliditylang.org/)
[![Avalanche Fuji](https://img.shields.io/badge/Chain-Avalanche_Fuji_(43113)-E84142?style=flat-square&logo=avalanche)](https://fuji.snowtrace.io/)
[![Storage](https://img.shields.io/badge/Decentralized_Storage-Lighthouse_IPFS-3B82F6?style=flat-square&logo=ipfs)](https://www.lighthouse.storage/)
[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Security](https://img.shields.io/badge/Auth-Privy_%7C_Jose_JWT-6366F1?style=flat-square)](https://www.privy.io/)

---

## 📌 Executive Summary

**Obelisk** (also known as the *Humanity Archive*) is a decentralized, anti-AI social protocol and verifiable media archive engineered to cryptographically authenticate real human experiences and permanently anchor them on-chain.

In an era dominated by generative AI and synthetic media, Obelisk guarantees authenticity by binding captured moments to **in-browser cryptographic liveness proofs**, storing them on **decentralized IPFS/Filecoin infrastructure**, and minting non-transferable **Soulbound Tokens (SBTs)** on EVM-compatible blockchains upon community verification.

This repository houses the core **backend architecture**, **cryptographic pipeline**, **smart contract relayers**, **database schemas**, and **security microservices** powering the platform. The system is designed to abstract away Web3 friction (sponsored gas, seamless embedded wallets, background minting relayers) while enforcing rigorous cryptographic, data integrity, and anti-Sybil constraints.

---

## 🏗️ System Architecture

Obelisk employs a **Hybrid On-Chain / Off-Chain Architecture** designed for high throughput, zero user friction, and permanent immutability.

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Web Application)"]
        Cam["Live Camera Capture & Sensors"]
        CryptoEngine["Crypto Engine (SHA-256 + ECDSA P-256)"]
        PrivySDK["Privy SDK (Embedded Wallet / OAuth)"]
    end

    subgraph Edge ["Edge Layer & Route Protection"]
        EdgeMiddleware["Next.js Edge Middleware (proxy.ts)\nJWT Verification & Route Guarding"]
    end

    subgraph Backend ["Server & API Engine (Next.js App Router)"]
        AuthAPI["/api/auth/wallet-session\n(Privy DID ➔ Custom JWT Conversion)"]
        OnboardAPI["/api/onboarding\n(Handle Uniqueness & Session Refresh)"]
        PostAPI["/api/posts\n(Feed Pagination & Metadata Processing)"]
        VouchAPI["/api/posts/[id]/vouch\n(Atomic Vouching & Event Trigger)"]
        BadgeAPI["/api/user/badges\n(Gamified Milestone Engine)"]
        AdminAPI["/api/admin/retry-sbt\n(Self-Healing Sweep Relayer)"]
    end

    subgraph Microservice ["Hardened Express Proxy (server/)"]
        ExpressApp["Express API Gateway"]
        SecurityStack["Helmet + HPP + Rate Limiter + Pino Logger"]
        PrivyGuard["requirePrivyAuth Middleware"]
    end

    subgraph Storage ["Decentralized Storage Layer"]
        LighthouseSDK["Lighthouse Web3 SDK"]
        FilecoinIPFS["Filecoin / IPFS Network"]
    end

    subgraph Database ["Relational Database (Supabase / PostgreSQL)"]
        DB_Users["users (DIDs, Handles, Scores)"]
        DB_Posts["posts (IPFS CIDs, Geo, SBT Status)"]
        DB_Vouches["vouches (Unique Compound Indexes)"]
        DB_RPC["RPC Functions (increment_received_vouches)"]
    end

    subgraph Blockchain ["EVM Blockchain Layer (Avalanche Fuji Testnet)"]
        ViemRelayer["Viem Relayer (Minter Wallet)"]
        SmartContract["ObeliskSBT.sol (ERC-721 Soulbound)"]
    end

    %% Flow connections
    Cam --> CryptoEngine
    PrivySDK --> AuthAPI
    CryptoEngine --> PostAPI
    
    EdgeMiddleware --> |Authorized| Backend
    AuthAPI --> |Set HttpOnly Cookie| EdgeMiddleware
    AuthAPI --> |Upsert User| DB_Users

    PostAPI --> |Archive Media & Proofs| LighthouseSDK
    LighthouseSDK --> FilecoinIPFS
    PostAPI --> |Insert Post Record| DB_Posts

    VouchAPI --> |Insert Vouch & RPC| DB_Vouches
    VouchAPI --> |Trigger First Vouch| ViemRelayer
    DB_Vouches --> DB_RPC

    ViemRelayer --> |Fetch Metadata & safeMint()| SmartContract
    ViemRelayer --> |Update Tx Hash & Token ID| DB_Posts

    AdminAPI --> |Sweep Pending/Failed Mints| ViemRelayer
    ExpressApp --> SecurityStack --> PrivyGuard
```

---

## 🔑 Core Engineering Highlights & Technical Decisions

### 1. Web2-to-Web3 Seamless Authentication Bridge
* **Problem**: Standard Web3 onboarding (seed phrases, manual gas, wallet popups) deters non-crypto users.
* **Solution**: Integrated **Privy** for friction-free social/OAuth logins coupled with automatic embedded wallet generation.
* **Backend Conversion**: Server-side endpoint (`/api/auth/wallet-session`) verifies Privy access tokens via standard cryptographic claims, maps/upserts user records by `privy_did`, and issues custom signed **Supabase HttpOnly JWTs** (`sb-access-token`) embedded with custom authorization claims (`sub`, `wallet_address`, `onboarded`).

### 2. Cryptographic Proof-of-Capture Pipeline
* **Content Hash Digest**: Live captured blobs are hashed client-side via Web Crypto API `SHA-256` (`hashBlob`).
* **Transient Session Signatures**: Captured media payloads (timestamp, GPS coordinates, camera specs, liveness scores) are signed using transient `ECDSA P-256` key pairs (`generateProofOfCapture`), producing verifiable base64 cryptographic signatures.
* **C2PA Metadata Binding**: Links the raw image binary to its JSON cryptographic proof manifest before storage dispatch.

### 3. Decentralized Storage Engine (Lighthouse / Filecoin IPFS)
* **Permanent Storage**: Media artifacts and metadata payloads are pinned to IPFS and backed by Filecoin storage contracts via the **Lighthouse Web3 SDK**.
* **Dual-CID Binding**: Every post archives both an `image_cid` (content binary) and a `proof_cid` (cryptographic provenance payload), generating deterministic gateway resolution URIs (`https://...lighthouseweb3.xyz/ipfs/{hash}`).

### 4. Custom Soulbound Token (SBT) Smart Contract Architecture
* **Non-Transferability**: Inherits OpenZeppelin ERC-721 and ERC721URIStorage, overriding internal standard hooks (`_update`) to strictly enforce that tokens can only be transferred from `address(0)` (minting). Any user-to-user transfer attempt explicitly reverts.
* **Approval Hardening**: Standard approval mechanisms (`approve`, `setApprovalForAll`) are overridden to revert immediately, rendering token transfers completely impossible.
* **Event Indexing**: Emits `SBTMinted(address indexed recipient, uint256 indexed tokenId, string tokenURI, string postId)` for off-chain event listening and verification.

### 5. Asynchronous, Resilient Minting Relayer & Self-Healing Sweeper
* **First-Vouch Trigger**: Minting is triggered off-chain when a post receives its **first community vouch** (`vouch_count` transitions from 0 to 1).
* **Non-Blocking Background Execution**: The vouch route responds to the client immediately while triggering `mintSBT()` in a fire-and-forget asynchronous workflow, preserving sub-second API latency.
* **State-Machine Tracking**: Posts transition through clear states: `none` ➔ `pending` ➔ `minting` ➔ `success` (or `failed` / `failed_permanent`).
* **Self-Healing Cron Sweep**: An administrative worker route (`/api/admin/retry-sbt`) processes pending or failed mint attempts with exponential backoff delays (`0s`, `5s`, `15s`), capped at `MAX_ATTEMPTS = 3` to prevent RPC spamming.

---

## 🛠️ Tech Stack & Dependencies

### Server & Backend Runtime
* **Framework**: Next.js 15.1 (App Router, Serverless Route Handlers, Edge Middleware)
* **Standalone Express Server**: Node.js, Express.js, TypeScript
* **Security & Utility**: Helmet, HPP (HTTP Parameter Pollution), CORS, Express Rate Limit, Pino Logging (`pino-http`, `pino-pretty`), Brotli Compression

### Database & Identity
* **Database**: Supabase PostgreSQL
* **Authentication**: Privy Node SDK (`@privy-io/node`), `jose` JWT signing library
* **ORM / Client**: `@supabase/supabase-js` (Client-side Anon Client + Server-side Service Role Admin Client)

### Cryptography & Blockchain
* **Smart Contracts**: Solidity `0.8.20` / `0.8.28`, Hardhat, OpenZeppelin Contracts v5
* **Blockchain Client**: Viem (`viem`), Wagmi (`wagmi`), Ethers.js v6
* **Target Network**: Avalanche Fuji Testnet (Chain ID `43113`)
* **Decentralized Storage**: Lighthouse Web3 SDK (`@lighthouse-web3/sdk`)

---

## 📂 Codebase Directory Layout

```
Obelisk/
├── app/                        # Next.js App Router Architecture
│   └── api/                    # Serverless API Endpoints
│       ├── admin/              # Administrative Operations
│       │   └── retry-sbt/      # Self-healing background SBT sweeper
│       ├── auth/               # Authentication Routes
│       │   ├── logout/         # Session termination & cookie revocation
│       │   └── wallet-session/ # Privy token exchange & JWT minting
│       ├── onboarding/         # Onboarding & profile initialization
│       │   └── check-handle/   # Handle uniqueness validation
│       ├── posts/              # Post & Feed Management
│       │   ├── route.ts        # POST (Create Post) & GET (Paginated Feed)
│       │   └── [id]/vouch/     # POST (Vouch mechanism & SBT trigger)
│       └── user/
│           └── badges/         # GET (Milestones & Trophy cabinet data)
│
├── contracts/                  # Smart Contract Subsystem (Hardhat)
│   ├── src/
│   │   └── ObeliskSBT.sol      # ERC-721 Soulbound Token Contract
│   ├── scripts/
│   │   └── deploy.ts           # Automated deployment & ABI generation script
│   └── hardhat.config.ts       # Network configs (Avalanche Fuji) & Solc options
│
├── lib/                        # Core Server Libraries & Utilities
│   ├── api/                    # Authenticated fetch abstractions
│   ├── blockchain/             # Blockchain Integration Layer
│   │   ├── mintSBT.ts          # Asynchronous minting & retry engine
│   │   ├── sbt.ts              # Auto-generated contract ABI & address
│   │   ├── pimlico.ts          # Smart Account & Paymaster interfaces
│   │   └── wagmi.ts            # Wagmi & Viem chain configurations
│   ├── data/
│   │   └── sbt_levels.json     # 100-Level milestone metadata definitions
│   ├── utils/
│   │   ├── crypto.ts           # Client/Server Web Crypto API (SHA-256 + ECDSA)
│   │   ├── storage.ts          # Lighthouse IPFS upload abstraction
│   │   └── geocode.ts          # Spatial reverse-geocoding helper
│   └── supabase.ts             # Supabase Browser & Admin Service-Role Clients
│
├── server/                     # Production Standalone Express Security Microservice
│   ├── src/
│   │   ├── app.ts              # Middleware stack (Helmet, Rate Limit, Compression)
│   │   ├── index.ts            # Server entrypoint & graceful shutdown
│   │   ├── middlewares/        # Express Privy authentication guards & Error handlers
│   │   ├── routes/             # Health checks & proxy auth routes
│   │   └── templates/          # Structured HTML/JSON 404 response generators
│   └── package.json
│
├── proxy.ts                    # Next.js Edge Middleware (Route Protection & JWT Decoding)
├── supabase.editor             # Primary Database Schema DDL & RPC Declarations
├── migration_badges.sql        # Database Migrations for Gamification & Counter RPCs
├── sbt_100_levels.json         # Master milestone level specifications
└── setup.md                    # Environment setup & step-by-step developer guide
```

---

## ⚡ Core Systems Deep Dive

### 1. Authentication & Route Guarding Flow (`proxy.ts` & `/api/auth/wallet-session`)

The system implements a multi-tier security pipeline protecting application routes at the Edge and API endpoints at the controller level:

```
[User Logins via Privy] ➔ [Client receives Privy Access Token]
                                  │
                                  ▼
                     POST /api/auth/wallet-session
                                  │
      ┌───────────────────────────┴───────────────────────────┐
      ▼                                                       ▼
[Verify Privy Token]                                 [Fetch Privy User Details]
      │                                                       │
      └───────────────────────────┬───────────────────────────┘
                                  ▼
                     [Lookup/Upsert User by privy_did]
                                  │
                                  ▼
                   [Sign Custom Supabase JWT (Jose)]
                   Claims: sub, role, wallet_address, onboarded
                                  │
                                  ▼
                  [Set HttpOnly Cookie: sb-access-token]
```

#### Edge Middleware Protection (`proxy.ts`)
Runs at the Vercel/Next.js Edge Runtime before page rendering:
* Extracts `sb-access-token` from incoming request cookies.
* Decodes JWT payload and checks `exp` timestamp.
* Enforces access control matrices:
  * Protected Routes (`/feed`, `/capture`, `/explore`, `/badges`, `/profile`): Requires valid JWT AND `onboarded: true`.
  * Onboarding Routes (`/onboarding`): Requires valid JWT AND `onboarded: false`.
  * Public Auth Routes (`/signin`): Redirects to `/feed` if authenticated.

---

### 2. Post Lifecycle, Cryptographic Proofs & IPFS Upload (`/api/posts`)

```
[Client Live Camera] ➔ [Extract Frame Blob]
                             │
                             ├─► [SHA-256 Content Hash (hashBlob)]
                             ├─► [Sign GPS + Timestamp Payload (generateProofOfCapture)]
                             │
                             ▼
                    POST /api/posts
                             │
                             ▼
        [Lighthouse SDK Web3 Decentralized Archival]
        ┌────────────────────┴────────────────────┐
        ▼                                         ▼
Upload Media Blob                       Upload Linked JSON Proof
(Returns image_cid & image_url)         (Returns proof_cid & proof_url)
        └────────────────────┬────────────────────┘
                             ▼
              [Insert Post into Supabase RDBMS]
```

---

### 3. Vouch Mechanism & Asynchronous SBT Minting (`/api/posts/[id]/vouch` & `mintSBT.ts`)

```
POST /api/posts/[id]/vouch
        │
        ├─► [1. Check Authentication via sb-access-token]
        ├─► [2. Self-Vouch Guard: post.user_id != voucher_id]
        ├─► [3. Insert Vouch into vouches Table (UNIQUE constraint prevents duplicates)]
        ├─► [4. Atomic RPC: increment_voucher_count(voucher_id)]
        ├─► [5. Atomic RPC: increment_received_vouches(post_author_id)]
        │
        ▼
Is post.vouch_count == 1 AND sbt_mint_status == 'none'?
        │
        ├──► NO:  Return { success: true, vouchCount } immediately.
        │
        └──► YES: Mark post.sbt_mint_status = 'pending'
                  Fire-and-forget: mintSBT(post, authorWalletAddress)
                  Return HTTP 200 to client immediately.
```

#### Asynchronous Minting Workflow (`lib/blockchain/mintSBT.ts`):
1. **Metadata Construction**: Assembles metadata JSON containing attributes (Pillar, Captured At, Liveness Score, Post ID, Chain ID).
2. **Metadata Archival**: Uploads JSON string to Lighthouse IPFS gateway via `uploadToLighthouse()`.
3. **On-Chain Relaying**: Interacts with `ObeliskSBT.sol` via **Viem** `writeContract` invoking `safeMint(to, metadataUri, postId)`.
4. **Receipt & Event Parsing**: Awaits 1-block transaction confirmation, parses `SBTMinted` log topic, extracts token ID.
5. **Database Sync**: Updates post record with `tx_hash`, `contract_address`, `sbt_token_id`, `sbt_minted_at`, and sets status to `success`.

---

### 4. Background Self-Healing Relayer (`/api/admin/retry-sbt`)

To guarantee ultimate consistency against RPC failures, network congestion, or gas spikes:
* Protected by shared secret header `x-admin-secret`.
* Fetches batch of up to 20 posts with `sbt_mint_status IN ('pending', 'failed')` where `sbt_mint_attempts < 3`.
* Applies exponential backoff delay based on attempt number:
  * Attempt 1: `0ms`
  * Attempt 2: `5,000ms`
  * Attempt 3: `15,000ms`
* If minting fails after attempt 3, marks post status as `failed_permanent`.

---

## 🗄️ Database Schema & Relational Model

Obelisk utilizes **Supabase / PostgreSQL** with an optimized relational schema and atomic RPC counters:

| Entity | Primary Key | Key Attributes / Relations | Purpose & Constraints |
| :--- | :--- | :--- | :--- |
| **`users`** | `id (uuid)` | `privy_did`, `handle`, `wallet_address`, `humanity_score`, `voucher_count`, `received_vouches` | Core user identity & reputation counters. DID and handle enforce `UNIQUE` constraints. |
| **`posts`** | `id (uuid)` | `user_id (FK -> users)`, `image_cid`, `proof_cid`, `liveness_score`, `sbt_token_id`, `sbt_mint_status` | Archived human moments with IPFS CIDs, geo-coordinates, and on-chain SBT state machine tracking. |
| **`vouches`** | `id (uuid)` | `post_id (FK -> posts)`, `voucher_id (FK -> users)` | Community verification mapping. Enforces `UNIQUE(post_id, voucher_id)` to block Sybil double-vouching. |

### Atomic Stored Procedures (RPCs)
- **`increment_voucher_count(user_id)`**: Atomically increments the outgoing vouch count for the vouching user.
- **`increment_received_vouches(user_id)`**: Atomically increments total received vouches for the post author (`SECURITY DEFINER`).

---

## 🔒 Security Architecture & Threat Matrix

| Threat Vector | Mitigation Strategy | Implementation Location |
| :--- | :--- | :--- |
| **Token Theft / XSS** | Auth tokens stored in `httpOnly`, `sameSite: lax`, `secure` cookies. Client JavaScript cannot access session tokens. | `app/api/auth/wallet-session/route.ts` |
| **Sybil Vouch Spam** | Compound unique index `UNIQUE(post_id, voucher_id)` enforced at database engine level. | `supabase.editor` (`public.vouches`) |
| **Self-Vouch Fraud** | Strict validation rule rejecting vouches where `post.user_id === voucher_id`. | `app/api/posts/[id]/vouch/route.ts` |
| **SBT Illegal Transfers** | Overridden ERC-721 `_update`, `approve`, `setApprovalForAll` functions revert any non-mint transfers on-chain. | `contracts/ObeliskSBT.sol` |
| **Database Direct Access** | RLS enforcement + Service-Role Key isolated strictly to server environments. | `lib/supabase.ts` |
| **RPC Denial of Service** | Background relayer uses exponential backoff delays and hard caps `sbt_mint_attempts <= 3`. | `lib/blockchain/mintSBT.ts` |
| **HTTP Parameter Attacks** | Express gateway utilizes `helmet` (security headers) and `hpp` (parameter pollution protection). | `server/src/app.ts` |
| **Admin Route Abuse** | Sweeper endpoint protected by mandatory secret token matching `process.env.ADMIN_SECRET`. | `app/api/admin/retry-sbt/route.ts` |

---

## 🛠️ Local Development & Setup Guide

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/SioPauwiii/Obelisk.git
cd Obelisk

# Install root App dependencies
npm install

# Install optional Express server dependencies
cd server
npm install
cd ..
```

### 2. Configure Database Migrations
1. Log into your Supabase Dashboard SQL Editor.
2. Run the SQL script located in `supabase.editor`.
3. Confirm that `users`, `posts`, and `vouches` tables, indexes, and RPC functions (`increment_voucher_count`, `increment_received_vouches`) are created.

### 3. Deploy Smart Contracts (Optional / Local Testnet)
To compile and deploy `ObeliskSBT.sol` to Avalanche Fuji Testnet:

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network fuji
```
*The deployment script automatically updates `lib/blockchain/sbt.ts` with the deployed contract address and ABI.*

### 4. Run Development Servers

```bash
# Run Next.js App API & App (Root)
npm run dev

# Run Standalone Express Microservice (Optional)
cd server
npm run dev
```

* Next.js App available at `http://localhost:3000`
* Express Health Endpoint available at `http://localhost:4000/api/v1/health`

### 5. Validate Build & Compilation

```bash
# Validate TypeScript compilation & Next.js route bundling
npm run build
```

---

## 📊 Summary of Portfolio Capabilities

This project highlights expertise in:
* **Distributed Systems & Hybrid Web2/Web3 Architectures**
* **Cryptographic Protocol Integration** (SHA-256 digests, ECDSA P-256 signatures, Web Crypto API)
* **Production-Grade Auth Security** (JWT state conversion, HttpOnly Cookie security, Edge Middleware)
* **Smart Contract Design & Security** (Custom ERC-721 Soulbound overrides, event emissions, OpenZeppelin v5)
* **Asynchronous Event-Driven Systems** (Fire-and-forget relayers, state machines, exponential backoff background workers)
* **Relational Database Design & Performance** (PostgreSQL compound indexes, atomic RPC stored procedures, foreign key cascading)
* **Microservices & API Engineering** (Hardened Express security middleware, rate-limiting, Pino structured logging)

---

## 📜 License

This system is released under the **MIT License**.
