import { keccak256, encodeAbiParameters, stringToBytes } from "viem";

const USDG = "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8";
const CHAIN_ID = 196;
const ON_CHAIN_DOMAIN = "0x415f0706e345fcaf25d5be24c4fd7830d0054fc5742c51a0db9319c759bd3743";

const DOMAIN_TYPEHASH = keccak256(
  stringToBytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
);

function computeDomain(name, version) {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "uint256" },
        { type: "address" },
      ],
      [
        DOMAIN_TYPEHASH,
        keccak256(stringToBytes(name)),
        keccak256(stringToBytes(version)),
        BigInt(CHAIN_ID),
        USDG,
      ]
    )
  );
}

const candidates = [
  ["Global Dollar", "1"],
  ["Global Dollar", "2"],
  ["Global Dollar", "v1"],
  ["Global Dollar", "v2"],
  ["USDG", "1"],
  ["USDG", "2"],
];

for (const [name, version] of candidates) {
  const hash = computeDomain(name, version);
  const match = hash === ON_CHAIN_DOMAIN;
  console.log(`${match ? "✓" : "✗"} name="${name}" version="${version}" → ${hash}`);
}
console.log("On-chain:", ON_CHAIN_DOMAIN);
