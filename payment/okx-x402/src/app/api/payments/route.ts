import { createServiceClient } from "@/lib/insforge";

export async function GET() {
  const insforge = createServiceClient();

  // Get latest 50 records
  const { data: payments, error } = await insforge.database
    .from("x402_payments")
    .select()
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Get aggregate stats
  const { data: allPayments, error: statsError } = await insforge.database
    .from("x402_payments")
    .select("amount");

  if (statsError) {
    return Response.json({ error: statsError.message }, { status: 500 });
  }

  const totalRequests = allPayments?.length ?? 0;
  const totalRevenue = allPayments
    ? allPayments.reduce((sum: number, p: { amount: string }) => sum + Number(p.amount), 0)
    : 0;

  return Response.json({
    payments: payments ?? [],
    stats: {
      totalRequests,
      totalRevenue,
      latestPayment: payments?.[0]?.created_at ?? null,
    },
  });
}
