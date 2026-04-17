// USDG on X Layer
const ASSET = "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8";

export function buildPaymentRequirements(endpointUrl: string) {
  return {
    scheme: "exact",
    maxAmountRequired: "1", // 0.000001 USDG (6 decimals, smallest unit)
    resource: endpointUrl,
    description: "Premium API endpoint — Crypto Market Report",
    mimeType: "application/json",
    payTo: process.env.PAYMENT_RECIPIENT ?? "0x0000000000000000000000000000000000000000",
    maxTimeoutSeconds: 300,
    asset: ASSET,
    extra: { name: "Global Dollar", version: "1" },
  };
}

export function build402Response(paymentRequirements: ReturnType<typeof buildPaymentRequirements>) {
  const challenge = {
    x402Version: 1,
    accepts: [
      {
        network: "eip155:196",
        ...paymentRequirements,
      },
    ],
  };

  return new Response(JSON.stringify({ error: "Payment required" }), {
    status: 402,
    headers: {
      "Content-Type": "application/json",
      "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(challenge)).toString("base64"),
    },
  });
}

export function decodePaymentSignature(header: string): unknown {
  return JSON.parse(Buffer.from(header, "base64").toString("utf-8"));
}

export function buildPaymentResponseHeader(settlement: {
  txHash: string;
  payer: string;
}) {
  return Buffer.from(
    JSON.stringify({
      success: true,
      transaction: settlement.txHash,
      network: "eip155:196",
      payer: settlement.payer,
    })
  ).toString("base64");
}
