# x402 Client-Side Payment Flow

Add browser wallet payment to the API Playground so users can complete the full x402 flow: request, pay, receive data.

## Architecture

### Flow

1. User clicks "Try it" → `fetch /api/report` without signature
2. Server returns 402 + `PAYMENT-REQUIRED` header (base64-encoded challenge)
3. Frontend decodes challenge, shows payment details inline in response area
4. User clicks "Confirm Payment" → connect wallet via `window.ethereum` → sign EIP-3009 `transferWithAuthorization`
5. Frontend encodes signed payload as base64, retries request with `X-PAYMENT-SIGNATURE` header
6. Server verifies + settles → returns 200 + report

### What changes

- **New dependency**: `viem` (wallet connection + EIP-712 typed signing)
- **New file**: `src/lib/x402-client.ts` — wallet connection and payment signing logic
- **Modified file**: `src/components/api-playground.tsx` — payment confirmation UI and state machine

### What does NOT change

- Server endpoints (`/api/report`, `/api/payments`)
- `src/lib/x402.ts`, `src/lib/okx-facilitator.ts`, `src/lib/insforge.ts`
- Dashboard, PaymentLog, StatsCards components
- Database schema

## Component Design

### State Machine (`api-playground.tsx`)

```
idle → loading → payment_required → signing → loading → success/error
```

- `idle`: initial, shows "Try it" button
- `loading`: request in flight, button shows "Calling..."
- `payment_required`: received 402, shows payment details + "Confirm Payment" button
- `signing`: waiting for wallet signature, button shows "Waiting for wallet..."
- `success`: received 200, shows report data
- `error`: any failure, shows error message

### Payment Confirmation UI

Inline in the existing response area (no modal):

- Yellow 402 status badge (existing)
- Payment info: amount `0.001 USDG`, network `X Layer`, recipient address (truncated)
- "Confirm Payment" button (same style as "Try it")
- If no wallet detected: show "Please install MetaMask or OKX Wallet"

### `src/lib/x402-client.ts`

Two functions:

- `connectWallet()`: connects `window.ethereum`, returns viem WalletClient. Requests chain switch to X Layer (chainId 196) if needed.
- `signPayment(challenge, walletClient)`: parses the 402 challenge, constructs EIP-3009 authorization params, signs with wallet, returns base64-encoded paymentPayload.

## EIP-3009 Signing

The x402 protocol uses EIP-3009 `transferWithAuthorization` for gasless token transfers.

### Authorization parameters (extracted from 402 challenge)

- `from`: user wallet address
- `to`: `payTo` from challenge
- `value`: `maxAmountRequired` from challenge
- `validAfter`: 0
- `validBefore`: current timestamp + `maxTimeoutSeconds`
- `nonce`: random 32 bytes

### Payment payload structure

```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "eip155:196",
  "payload": {
    "signature": "0x...",
    "authorization": {
      "from": "0x...",
      "to": "0x...",
      "value": "1000",
      "validAfter": "0",
      "validBefore": "...",
      "nonce": "0x..."
    }
  }
}
```

### Chain configuration

X Layer mainnet, chainId 196. If user's wallet is on a different chain, request switch via `wallet_switchEthereumChain`.

## Error Handling

Only handle cases that actually occur:

- **No wallet installed**: `window.ethereum` undefined → show install prompt in payment area
- **User rejects connection/signing**: wallet popup cancelled → return to `payment_required` state, user can retry
- **Wrong chain**: auto-request switch to X Layer (196), show error if switch fails
- **Server verification/settlement failure**: display server error message in response area
