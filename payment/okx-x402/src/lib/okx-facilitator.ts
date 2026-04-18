import crypto from "crypto";

const OKX_BASE = "https://web3.okx.com/api/v6/x402";
const MOCK = process.env.MOCK_OKX_FACILITATOR === "true";

function signOKX(
  timestamp: string,
  method: string,
  path: string,
  body: string
): string {
  const prehash = timestamp + method + path + body;
  return crypto
    .createHmac("sha256", process.env.OKX_SECRET_KEY!)
    .update(prehash)
    .digest("base64");
}

function okxHeaders(method: string, path: string, body: string): Record<string, string> {
  const timestamp = new Date().toISOString();
  return {
    "OK-ACCESS-KEY": process.env.OKX_API_KEY!,
    "OK-ACCESS-SIGN": signOKX(timestamp, method, path, body),
    "OK-ACCESS-PASSPHRASE": process.env.OKX_PASSPHRASE!,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "Content-Type": "application/json",
  };
}

function extractPayer(paymentPayload: unknown): string {
  const p = paymentPayload as { payload?: { authorization?: { from?: string } } };
  return p?.payload?.authorization?.from ?? "0x0000000000000000000000000000000000000000";
}

function mockTxHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

export async function verifyPayment(
  paymentPayload: unknown,
  paymentRequirements: unknown
) {
  if (MOCK) {
    const payer = extractPayer(paymentPayload);
    console.log("[OKX verify MOCK] payer:", payer);
    return { isValid: true, payer };
  }

  const path = "/api/v6/x402/verify";
  const body = JSON.stringify({
    x402Version: 1,
    chainIndex: "196",
    paymentPayload,
    paymentRequirements,
  });

  const res = await fetch(OKX_BASE + "/verify", {
    method: "POST",
    headers: okxHeaders("POST", path, body),
    body,
  });

  const json = await res.json();
  console.log("[OKX verify] status:", res.status, "response:", JSON.stringify(json, null, 2));
  return json.data?.[0] ?? { isValid: false, invalidReason: json.msg ?? JSON.stringify(json) };
}

export async function settlePayment(
  paymentPayload: unknown,
  paymentRequirements: unknown
) {
  if (MOCK) {
    const payer = extractPayer(paymentPayload);
    const txHash = mockTxHash();
    console.log("[OKX settle MOCK] payer:", payer, "txHash:", txHash);
    return { success: true, txHash, payer };
  }

  const path = "/api/v6/x402/settle";
  const body = JSON.stringify({
    x402Version: 1,
    chainIndex: "196",
    syncSettle: true,
    paymentPayload,
    paymentRequirements,
  });

  const res = await fetch(OKX_BASE + "/settle", {
    method: "POST",
    headers: okxHeaders("POST", path, body),
    body,
  });

  const json = await res.json();
  console.log("[OKX settle] status:", res.status, "response:", JSON.stringify(json, null, 2));
  return json.data?.[0] ?? { success: false, errorReason: json.msg ?? JSON.stringify(json) };
}
