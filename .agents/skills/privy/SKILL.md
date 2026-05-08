---
name: Privy
description: Use when building user authentication systems, creating embedded wallets for users, managing wallet controls and policies, signing transactions, or integrating wallet infrastructure into web, mobile, or backend applications. Agents should reach for this skill when implementing onboarding flows, wallet creation, transaction signing, policy enforcement, or wallet management across EVM, Solana, and other blockchains.
metadata:
    mintlify-proj: privy
    version: "1.0"
---

# Privy Skill Reference

## Product summary

Privy is a wallet and authentication infrastructure platform that enables developers to embed non-custodial wallets and user authentication directly into applications. It provides client-side SDKs (React, React Native, Swift, Android, Flutter, Unity) and server-side SDKs (Node.js, Python, Java, Go, Rust) to manage users, create wallets, sign transactions, and enforce wallet controls across 50+ blockchains including Ethereum, Solana, and EVM-compatible chains.

**Key files and concepts:**
- **App ID and App Secret**: Credentials obtained from the Privy Dashboard, required for API authentication
- **PrivyProvider**: React wrapper component that initializes the Privy SDK
- **PrivyClient**: Server-side entry point for backend wallet and user management
- **Embedded wallets**: Privy-managed wallets secured by key sharding in trusted execution environments
- **Authorization keys**: P-256 keypairs that control wallets and policies server-side
- **Policies**: Rules that constrain what actions wallets can perform
- **Webhooks**: Event subscriptions for user, wallet, transaction, and action lifecycle events

Primary docs: https://docs.privy.io

## When to use

Reach for this skill when:
- Building user authentication flows (email, SMS, social, passkey, wallet-based login)
- Creating or managing embedded wallets for users
- Signing transactions on behalf of users or applications
- Implementing wallet controls (owners, signers, policies)
- Managing user accounts and linking multiple authentication methods
- Setting up transaction policies (amount limits, recipient whitelists, time windows)
- Handling wallet actions (transfers, swaps, earn deposits)
- Integrating external wallets (MetaMask, Phantom, etc.)
- Building server-side wallet automation or trading bots
- Implementing multi-factor authentication for wallet actions
- Tracking wallet and transaction events via webhooks

## Quick reference

### SDK Installation

| Platform | Command | Entry Point |
|----------|---------|-------------|
| React | `npm install @privy-io/react-auth@latest` | `PrivyProvider` + `usePrivy()` hook |
| React Native | `npm install @privy-io/expo@latest` | `PrivyProvider` + hooks |
| Node.js | `npm install @privy-io/node@latest` | `PrivyClient` class |
| Python | `pip install privy-client` | `PrivyClient` class |
| Java | Maven/Gradle dependency | `PrivyClient` class |
| Go | `go get github.com/privy-io/go-sdk` | Client methods |
| Rust | Cargo dependency | `PrivyClient` struct |

### API Authentication

All REST API requests require:
```
Authorization: Basic Auth (app-id:app-secret)
privy-app-id: <your-app-id>
```

### Core Configuration (React)

```tsx
<PrivyProvider
  appId="your-app-id"
  clientId="optional-client-id"
  config={{
    embeddedWallets: {
      ethereum: { createOnLogin: 'users-without-wallets' },
      solana: { createOnLogin: 'users-without-wallets' }
    }
  }}
>
  {children}
</PrivyProvider>
```

### Core Configuration (Node.js)

```ts
import { PrivyClient } from '@privy-io/node';

const privy = new PrivyClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret'
});
```

### Common Wallet Operations

| Task | React | Node.js |
|------|-------|---------|
| Create wallet | `useCreateWallet().createWallet()` | `privy.wallets().create({chain_type, owner})` |
| Get wallet | `useWallets().wallets` | `privy.wallets().get(walletId)` |
| Sign message | `useSignMessage().signMessage()` | `privy.wallets().ethereum().signMessage()` |
| Send transaction | `useSendTransaction().sendTransaction()` | `privy.wallets().ethereum().sendTransaction()` |
| Get balance | `useBalance()` hook | `privy.wallets().getBalance(walletId)` |

### Login Methods

Privy supports: `email`, `sms`, `google`, `discord`, `twitter`, `github`, `linkedin`, `spotify`, `instagram`, `tiktok`, `apple`, `farcaster`, `telegram`, `passkey`, `wallet`

## Decision guidance

### When to use embedded vs. external wallets

| Scenario | Embedded Wallets | External Wallets |
|----------|------------------|------------------|
| New users, onboarding | ✓ Best choice | Not ideal |
| Existing wallet users | Optional | ✓ Best choice |
| Self-custodial requirement | ✓ Yes (user owns keys) | ✓ Yes (user owns keys) |
| Server-side control needed | ✓ Yes (with auth keys) | ✗ No |
| Cross-chain support | ✓ 50+ chains | Varies by wallet |

### When to use Privy authentication vs. JWT-based auth

| Aspect | Privy Auth | JWT-based Auth |
|--------|-----------|-----------------|
| Setup time | Minutes | Already have provider |
| Login methods | 15+ built-in | Your provider's methods |
| Wallet integration | Native | Via Privy SDK |
| Best for | New apps, wallets | Existing auth systems |

### Wallet ownership models

| Model | Owner | Use Case |
|-------|-------|----------|
| User-owned | User ID | Consumer wallets, self-custody |
| User + server | User + auth key | Automated trading, limit orders |
| Application-owned | Auth key | Bots, treasuries, agents |
| Custodial | Licensed custodian | Regulated, FBO-style accounts |

## Workflow

### 1. Set up Privy in your app

- Get App ID and App Secret from Privy Dashboard
- Install appropriate SDK for your platform
- Wrap app with `PrivyProvider` (client) or instantiate `PrivyClient` (server)
- Configure login methods and wallet creation settings

### 2. Authenticate users

- Use Privy's built-in login UI or custom authentication provider
- Verify user access tokens on backend (use SDK's verification methods)
- Access authenticated user object with linked accounts and wallets

### 3. Create or retrieve wallets

- For new users: configure `createOnLogin` to auto-create wallets
- For existing users: call `createWallet()` or retrieve via `getWallet()`
- Specify wallet owner (user ID or authorization key)
- Optionally add signers and policies at creation time

### 4. Configure controls and policies

- Define wallet owners (who has full control)
- Add additional signers with scoped permissions
- Create policies to enforce transaction limits, recipient whitelists, time windows
- Test policies in development before production deployment

### 5. Implement transaction signing

- Use client-side hooks (`useSignMessage`, `useSendTransaction`) for user wallets
- Use server-side methods with authorization context for app-owned wallets
- Handle authorization signatures for policy-controlled wallets
- Implement error handling for policy violations and insufficient funds

### 6. Monitor and react to events

- Register webhook endpoints in Privy Dashboard
- Subscribe to relevant events (user.created, wallet.funds_deposited, transaction.confirmed)
- Implement idempotent webhook handlers (use idempotency keys)
- Verify webhook signatures before processing

### 7. Verify before deployment

- Test all authentication flows in development
- Verify wallet creation and transaction signing work end-to-end
- Check policy enforcement with test transactions
- Review security checklist and CSP configuration
- Test webhook delivery and error handling

## Common gotchas

- **Forgetting to wait for Privy to be ready**: Always check `usePrivy().ready` before consuming Privy state in React. Stale state can cause unexpected behavior.

- **Exposing app secret in frontend code**: App secret is for backend only. Never include it in client-side code or environment files shipped to browsers.

- **Not handling authorization signatures correctly**: When using authorization keys, ensure you're signing the correct payload (request body, URL, headers). Malformed signatures cause `zero_correct_authorization_signatures` errors.

- **Policy violations silently failing**: Transactions that violate policies return `policy_violation` errors. Always check policy conditions match your transaction parameters and test in development.

- **Automatic wallet creation limitations**: `createOnLogin` only works with the Privy modal, not custom login methods like `loginWithCode` or OAuth direct flows. Use manual `createWallet()` for these cases.

- **Missing idempotency keys on wallet creation**: Wallet creation is rate-limited. Use idempotency keys to safely retry failed requests without creating duplicates.

- **Not verifying tokens on backend**: Always verify access token signatures, expiration, issuer, and audience on your backend. Never trust tokens without verification.

- **Storing refresh tokens in localStorage**: Refresh tokens are long-lived and should only be used by Privy SDKs, never in application code. Let the SDK handle token rotation.

- **Forgetting to configure authentication settings for JWT-based auth**: If using custom authentication, register your JWKS endpoint and user ID claim in the Privy Dashboard before issuing user keys.

- **Rate limiting on API calls**: Privy rate limits REST API endpoints. Implement exponential backoff and batch requests where possible. Use identity tokens instead of querying users repeatedly.

- **Webhook delivery not idempotent**: Webhooks can be retried. Implement idempotent handlers using webhook IDs or idempotency keys to avoid processing duplicates.

- **Solana peer dependency issues**: If using Solana wallets, install peer dependencies (`@solana/kit`, etc.) and configure webpack/Turbopack externals correctly to avoid build errors.

## Verification checklist

Before submitting work with Privy:

- [ ] App ID and App Secret are correctly configured (secret never exposed client-side)
- [ ] PrivyProvider wraps the app at the root level (or PrivyClient instantiated server-side)
- [ ] `usePrivy().ready` is checked before consuming Privy state (React)
- [ ] All authentication flows tested (email, social, wallet, passkey as applicable)
- [ ] Wallet creation works for new users (auto or manual)
- [ ] Wallet signing tested for target chain (Ethereum, Solana, etc.)
- [ ] Policies are correctly defined and tested with sample transactions
- [ ] Authorization signatures are properly signed and included in headers (if using auth keys)
- [ ] Webhooks are registered and tested (if using event-driven flows)
- [ ] Error handling covers policy violations, insufficient funds, and expired sessions
- [ ] Security checklist items reviewed (CSP, HTTPS, token verification, etc.)
- [ ] Rate limiting handled with exponential backoff (if making many API calls)
- [ ] Idempotency keys used for wallet creation and critical operations
- [ ] Token verification implemented on backend (if using Privy auth)

## Resources

**Comprehensive navigation**: https://docs.privy.io/llms.txt

**Critical documentation pages**:
1. [Key Concepts](https://docs.privy.io/basics/key-concepts) — Understand authentication, wallets, and controls
2. [API Reference](https://docs.privy.io/api-reference/introduction) — Complete REST API documentation with examples
3. [Security Implementation Guide](https://docs.privy.io/security/implementation-guide/security-checklist) — Security best practices and checklist

---

> For additional documentation and navigation, see: https://docs.privy.io/llms.txt