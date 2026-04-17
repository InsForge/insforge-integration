-- x402 Payment Records
-- Run this against your InsForge database before starting the app

create table if not exists x402_payments (
  id uuid default gen_random_uuid() primary key,
  payer_address text not null,
  endpoint text not null,
  amount text not null,
  tx_hash text not null,
  chain text default 'xlayer',
  status text default 'settled',
  response_summary text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_x402_payments_payer on x402_payments (payer_address);
create index if not exists idx_x402_payments_created on x402_payments (created_at desc);

-- Enable realtime for live dashboard
-- Create channel pattern for realtime
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('x402_payments', 'Payment events for dashboard', true)
ON CONFLICT DO NOTHING;

-- Trigger to publish INSERT events to realtime
CREATE OR REPLACE FUNCTION notify_x402_payment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.publish(
    'x402_payments',
    'INSERT_x402_payments',
    jsonb_build_object(
      'new', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER x402_payment_realtime
  AFTER INSERT ON x402_payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_x402_payment();
