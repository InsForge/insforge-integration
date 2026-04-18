import { createPublicClient, http } from "viem";

const RPCS = [
  "https://rpc.xlayer.tech",
  "https://xlayerrpc.okx.com",
  "https://rpc.ankr.com/xlayer",
  "https://xlayer-rpc.publicnode.com",
];

let client;
for (const rpc of RPCS) {
  try {
    const c = createPublicClient({ transport: http(rpc) });
    await c.getChainId();
    client = c;
    console.log("Using RPC:", rpc);
    break;
  } catch {
    console.log("Failed:", rpc);
  }
}
if (!client) {
  console.error("No RPC reachable");
  process.exit(1);
}

const USDG = "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8";

const abi = [
  { name: "name", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "version", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "DOMAIN_SEPARATOR", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { name: "eip712Domain", type: "function", stateMutability: "view", inputs: [], outputs: [
    { name: "fields", type: "bytes1" },
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
    { name: "salt", type: "bytes32" },
    { name: "extensions", type: "uint256[]" },
  ]},
];

async function tryRead(fnName) {
  try {
    const result = await client.readContract({ address: USDG, abi, functionName: fnName });
    console.log(`✓ ${fnName}:`, result);
  } catch (e) {
    console.log(`✗ ${fnName}:`, e.shortMessage || e.message?.slice(0, 200));
  }
}

await tryRead("name");
await tryRead("version");
await tryRead("DOMAIN_SEPARATOR");
await tryRead("eip712Domain");
