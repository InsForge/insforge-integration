import { NextRequest } from "next/server";
import { verifyPayment, settlePayment } from "@/lib/okx-facilitator";
import { createServiceClient } from "@/lib/insforge";
import {
  buildPaymentRequirements,
  build402Response,
  decodePaymentSignature,
  buildPaymentResponseHeader,
} from "@/lib/x402";

interface Asset {
  symbol: string;
  price: number;
  change_24h: number;
  signal: "bullish" | "bearish" | "neutral";
}

function generateMarketSnapshot(): Asset[] {
  const rand = (min: number, max: number) => +(min + Math.random() * (max - min)).toFixed(2);
  const signals: Asset["signal"][] = ["bullish", "bearish", "neutral"];
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  return [
    { symbol: "BTC", price: rand(83000, 86000), change_24h: rand(-3, 5), signal: pick(signals) },
    { symbol: "ETH", price: rand(1600, 1750), change_24h: rand(-4, 4), signal: pick(signals) },
    { symbol: "SOL", price: rand(125, 155), change_24h: rand(-3, 7), signal: pick(signals) },
    { symbol: "AVAX", price: rand(20, 28), change_24h: rand(-5, 6), signal: pick(signals) },
    { symbol: "LINK", price: rand(14, 18), change_24h: rand(-4, 5), signal: pick(signals) },
  ];
}

async function generateAIReport(assets: Asset[]): Promise<string> {
  const insforge = createServiceClient();

  const marketTable = assets
    .map((a) => `- ${a.symbol}: $${a.price.toFixed(2)} (${a.change_24h > 0 ? "+" : ""}${a.change_24h}% 24h, signal: ${a.signal})`)
    .join("\n");

  const prompt = `You are a crypto market analyst. Write a concise professional market report in markdown based on the following 24h snapshot. Keep it under 250 words.

Snapshot:
${marketTable}

Structure your response as:
## Market Overview
2-3 sentences on overall sentiment and flow.

## Key Movers
Brief commentary on the most notable assets (1-2 lines each).

## Signal Summary
One-line actionable takeaway.

Output ONLY the markdown. No preamble, no disclaimers.`;

  try {
    const completion = await insforge.ai.chat.completions.create({
      model: "anthropic/claude-sonnet-4.5",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 600,
    });
    return completion.choices[0]?.message?.content ?? "_AI response was empty._";
  } catch (err) {
    console.error("[AI] generation failed:", err);
    return "_AI service unavailable — falling back to raw data._";
  }
}

export async function POST(req: NextRequest) {
  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const paymentRequirements = buildPaymentRequirements(`${baseUrl}/api/report`);

  // Check for payment signature
  const paymentSigHeader = req.headers.get("PAYMENT-SIGNATURE");

  if (!paymentSigHeader) {
    return build402Response(paymentRequirements);
  }

  // Decode and verify payment
  let paymentPayload: unknown;
  try {
    paymentPayload = decodePaymentSignature(paymentSigHeader);
  } catch {
    return Response.json({ error: "Invalid payment signature encoding" }, { status: 400 });
  }

  const verification = await verifyPayment(paymentPayload, paymentRequirements);
  if (!verification.isValid) {
    return Response.json(
      { error: "Payment invalid", reason: verification.invalidReason },
      { status: 402 }
    );
  }

  // Settle payment on-chain
  const settlement = await settlePayment(paymentPayload, paymentRequirements);
  if (!settlement.success) {
    return Response.json(
      { error: "Settlement failed", reason: settlement.errorReason },
      { status: 500 }
    );
  }

  // Record payment in InsForge
  const insforge = createServiceClient();
  const { error: insertError } = await insforge.database.from("x402_payments").insert([{
    payer_address: settlement.payer,
    endpoint: "/api/report",
    amount: paymentRequirements.maxAmountRequired,
    tx_hash: settlement.txHash,
    status: "settled",
    response_summary: "Crypto Market Analysis report",
  }]);
  if (insertError) {
    console.error("[payment-log] insert failed:", insertError, "tx:", settlement.txHash);
  }

  // Generate report (market snapshot + AI analysis)
  const assets = generateMarketSnapshot();
  const analysis = await generateAIReport(assets);

  const report = {
    title: "Crypto Market Analysis",
    generated_at: new Date().toISOString(),
    model: "anthropic/claude-sonnet-4.5",
    assets,
    analysis,
  };

  return Response.json(
    {
      report,
      payment: {
        tx_hash: settlement.txHash,
        payer: settlement.payer,
        amount: "0.000001 USDG",
      },
    },
    {
      status: 200,
      headers: {
        "PAYMENT-RESPONSE": buildPaymentResponseHeader(settlement),
      },
    }
  );
}
