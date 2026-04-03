import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { createInsforgeClient, getRequiredClerkToken } from '../lib/insforge';

type DealRow = {
  id: string;
  user_id: string;
  name: string;
  stage: string;
  amount: number | null;
  created_at: string;
};

export function DealsPage() {
  const { user } = useUser();
  const { getToken, signOut } = useAuth();

  const [deals, setDeals] = useState<DealRow[]>([]);
  const [dealName, setDealName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const token = await getRequiredClerkToken(getToken);
      const insforge = createInsforgeClient(token);
      const { data, error } = await insforge.database.from('deals').select('*').order('created_at', { ascending: false });
      if (error) {
        setError(error.message ?? 'Failed to load deals');
        return;
      }
      setDeals((data as DealRow[] | null) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load deals');
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!dealName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const token = await getRequiredClerkToken(getToken);
      const insforge = createInsforgeClient(token);
      const { error } = await insforge.database
        .from('deals')
        .insert({
          name: dealName.trim(),
          amount: amount.trim() ? Number(amount) : null,
          stage: 'new',
        })
        .select();
      if (error) {
        setError(error.message ?? 'Failed to create deal');
        return;
      }
      setDealName('');
      setAmount('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  }

  async function toggleDealStage(deal: DealRow) {
    setError(null);
    try {
      const token = await getRequiredClerkToken(getToken);
      const insforge = createInsforgeClient(token);
      const { error } = await insforge.database
        .from('deals')
        .update({ stage: deal.stage === 'won' ? 'new' : 'won' })
        .eq('id', deal.id);
      if (error) {
        setError(error.message ?? 'Failed to update deal');
        return;
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update deal');
    }
  }

  async function deleteDeal(deal: DealRow) {
    setError(null);
    try {
      const token = await getRequiredClerkToken(getToken);
      const insforge = createInsforgeClient(token);
      const { error } = await insforge.database.from('deals').delete().eq('id', deal.id);
      if (error) {
        setError(error.message ?? 'Failed to delete deal');
        return;
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete deal');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-5">
        <div>
          <div className="text-sm text-slate-300">Signed in</div>
          <div className="font-semibold">{user?.primaryEmailAddress?.emailAddress ?? user?.id}</div>
        </div>
        <div className="flex items-center gap-3">
          <UserButton />
          <button
            className="rounded-md bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
            onClick={() => signOut({ redirectUrl: '/' })}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 pb-14">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h1 className="text-lg font-semibold">Deals</h1>

          <form onSubmit={addDeal} className="mt-4 flex gap-2">
            <input
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              placeholder="Deal name..."
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (optional)"
              inputMode="decimal"
              className="w-36 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500 disabled:opacity-60"
            >
              Create
            </button>
          </form>

          {error ? <div className="mt-3 rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div> : null}

          <div className="mt-4 divide-y divide-slate-800 overflow-hidden rounded-lg border border-slate-800">
            {deals.length === 0 ? (
              <div className="px-3 py-10 text-center text-sm text-slate-400">No deals yet.</div>
            ) : (
              deals.map((deal) => (
                <div key={deal.id} className="flex items-center gap-3 bg-slate-950/40 px-3 py-3">
                  <button
                    onClick={() => toggleDealStage(deal)}
                    className={`h-5 w-5 rounded border ${
                      deal.stage === 'won' ? 'border-indigo-400 bg-indigo-600' : 'border-slate-600 bg-transparent'
                    }`}
                    aria-label="toggle"
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm ${deal.stage === 'won' ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                      {deal.name}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {deal.stage} · {deal.amount ?? '-'} · {deal.user_id}
                    </div>
                  </div>
                  <button onClick={() => deleteDeal(deal)} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs hover:bg-slate-700">
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={refresh} className="rounded-md bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700">
              Refresh
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

