import {
  createWalletClient,
  custom,
  type WalletClient,
  type Address,
  hexToBigInt,
} from "viem";

const X_LAYER_CHAIN = {
  id: 196,
  name: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.xlayer.tech"] },
  },
} as const;

// EIP-3009 transferWithAuthorization typed data
const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

interface PaymentChallenge {
  x402Version: number;
  accepts: Array<{
    network: string;
    scheme: string;
    maxAmountRequired: string;
    resource: string;
    description: string;
    payTo: string;
    maxTimeoutSeconds: number;
    asset: string;
    extra: { name: string; version: string };
  }>;
}

export function decodeChallenge(base64Header: string): PaymentChallenge {
  return JSON.parse(atob(base64Header));
}

export async function connectWallet(): Promise<WalletClient> {
  if (!window.ethereum) {
    throw new Error("NO_WALLET");
  }

  const client = createWalletClient({
    chain: X_LAYER_CHAIN,
    transport: custom(window.ethereum),
  });

  // Request account access
  await client.requestAddresses();

  // Switch to X Layer if needed
  const chainId = await client.getChainId();
  if (chainId !== 196) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xc4" }], // 196 in hex
      });
    } catch (switchError: unknown) {
      // Chain not added — try adding it
      if (
        typeof switchError === "object" &&
        switchError !== null &&
        "code" in switchError &&
        (switchError as { code: number }).code === 4902
      ) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xc4",
              chainName: "X Layer",
              nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
              rpcUrls: ["https://rpc.xlayer.tech"],
              blockExplorerUrls: ["https://www.okx.com/web3/explorer/xlayer"],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  return client;
}

export async function signPayment(
  challenge: PaymentChallenge,
  walletClient: WalletClient
): Promise<string> {
  const accept = challenge.accepts[0];
  const [account] = await walletClient.getAddresses();

  // Random 32-byte nonce
  const nonceBytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = ("0x" +
    Array.from(nonceBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")) as `0x${string}`;

  const validBefore = BigInt(Math.floor(Date.now() / 1000) + accept.maxTimeoutSeconds);

  const authorization = {
    from: account,
    to: accept.payTo as Address,
    value: hexToBigInt(
      ("0x" + BigInt(accept.maxAmountRequired).toString(16)) as `0x${string}`
    ),
    validAfter: BigInt(0),
    validBefore,
    nonce,
  };

  const signature = await walletClient.signTypedData({
    account,
    domain: {
      name: accept.extra.name,
      version: accept.extra.version,
      chainId: 196,
      verifyingContract: accept.asset as Address,
    },
    types: EIP3009_TYPES,
    primaryType: "TransferWithAuthorization",
    message: authorization,
  });

  const paymentPayload = {
    x402Version: challenge.x402Version,
    scheme: accept.scheme,
    network: accept.network,
    payload: {
      signature,
      authorization: {
        from: account,
        to: accept.payTo,
        value: accept.maxAmountRequired,
        validAfter: "0",
        validBefore: validBefore.toString(),
        nonce,
      },
    },
  };

  return btoa(JSON.stringify(paymentPayload));
}
