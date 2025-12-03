# Storax: Solana's Zero-Knowledge Storage

(okay, title done, but might tweak later?)

> Secure, encrypted file storage with zero-knowledge proofs on Solana.
> (*I think that’s punchy enough? maybe? anyway—moving on.*)

---

## Characteristics

(ugh I hate bullet formatting, but here we go)

* 🔐 **Client-Side Encryption** — everything gets encrypted *before* it leaves your browser
  (AES-256-GCM — yeah the strong one)
  → IPFS stores only the scrambled version
  → Your **Solana wallet** basically becomes your keyring

* 🔒 **Zero-Knowledge Proofs** — storage gets verified **without** revealing your stuff
  (magic math… well, zk-math but still)

* 📊 **Activity Tracking** — see what happened: uploaded? downloaded? verified?

* ⚙️ **Per-Wallet Settings** — because one wallet isn’t like the others (preferences saved per wallet)

(okay that section is less messy than expected)

---

## How It Works

(Here’s where I over-explain…)

### 1️⃣ Connect Wallet

Phantom, Solflare… whatever.
Wallet connects → Storage unlocked (only yours).

### 2️⃣ Upload (and encryption freak-out phase)

So when you upload a file:

1. Your browser encrypts it using AES-256-GCM
   (key derived from your wallet’s public key — yeah slightly unusual but roll with it)
2. The encrypted blob becomes a **CID** (IPFS content ID — unique hash thing)
3. File → IPFS, pinned so it doesn’t disappear into the void
4. Some fancy zero-knowledge proof gets generated to prove the file exists somewhere
   *(without ever showing the file… wild)*

### 3️⃣ Retrieve Your Files

* Wallet signs → key derived again → browser decrypts
* Any IPFS gateway can fetch the encrypted data (still garbage without your wallet)

### 4️⃣ Verification

Periodic checks on-chain confirm stuff is still stored
→ Dashboard shows green checkmarks or red uh-oh’s

(ok yes, that made sense in my head)

---

## Security

*(quick table because… trust signaling)*

| Layer          | Protection                           |
| -------------- | ------------------------------------ |
| Encryption     | AES-256-GCM                          |
| Key Derivation | PBKDF2 — 100k iterations             |
| Storage        | IPFS — immutable + content-addressed |
| Verification   | Solana ZK proofs                     |

### What’s Stored on IPFS?

Only **encrypted** data.
No plaintext. No metadata leaks… well minimal.

### Who Can Decrypt?

Only the same wallet that encrypted it.
(If you lose that wallet… well… yeah don’t do that.)

---

## Getting Started

(sigh, the boring section)

### Requirements

* Node.js 18+
* npm or yarn
* A Solana wallet (Phantom plays nicest)

### Install Stuff

```bash
npm install       # dependencies
npm run dev       # start dev
npm run build     # prod build
npm start         # run built app
```

### Environment Setup

Create `.env.local`:

```env
# Pinata for IPFS uploads
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
```

(pro tip: don’t commit this file 😬)

---

## Configuration

### Storage Modes

| Mode  | Description                       | Availability |
| ----- | --------------------------------- | ------------ |
| IPFS  | Upload to the decentralized swarm | Global       |
| Local | Stays in your browser only        | This device  |

### Advanced Options

(per-wallet customization — I like that)

* Shards: 8–64
* Redundancy: 1–10 copies
* Encryption: Standard vs Ultra Paranoid™

---

## Tech Stack

(list time, because investors love these)

* Next.js 15
* React 19
* Tailwind (obviously)
* Solana + Web3.js
* Wallet Adapter
* IPFS (Pinata)
* Web Crypto API

(ok breathe)

---

## Architecture

(I swear this diagram looked better in my mind)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your Browser   │ ──▶ │   IPFS Network  │ ──▶ │  IPFS Gateways  │
│ (Encrypt/Decrypt)│     │   (Storage)     │     │    (Access)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│     Solana       │
│ (ZK Verification)│
└─────────────────┘
```

(*It’s fine. It conveys the point.*)

---

## License

Proprietary — you can look but you can’t touch.

---

<p align="center">
…built with ❤️ and a slight caffeine dependency for the Solana ecosystem ☕
</p>
---
