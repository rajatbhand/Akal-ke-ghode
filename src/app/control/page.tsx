"use client";
import { useState, useEffect } from "react";
import { formatInr } from "@/lib/format";

export default function ControlPage() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string>("");
  const [window, setWindow] = useState<number>(0);
  const [teams, setTeams] = useState<any[]>([]);
  const [state, setState] = useState<any>(null);
  const [localActive, setLocalActive] = useState<'R'|'G'|'B'|'Host'>('Host');
  const [questions, setQuestions] = useState<any[]>([]);
  const [pendingAdjust, setPendingAdjust] = useState<{ R: number; G: number; B: number }>({ R: 0, G: 0, B: 0 });
  const [r2Preview, setR2Preview] = useState<any>(null);
  const [totals, setTotals] = useState<{ R: number; G: number; B: number }>({ R: 0, G: 0, B: 0 });
  // Local state for immediate UI feedback
  const [localBigX, setLocalBigX] = useState<boolean>(false);
  const [localScorecard, setLocalScorecard] = useState<boolean>(false);
  const [localVoting, setLocalVoting] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const w = await fetch("/api/audience/window").then((r) => r.json());
      setWindow(w.window);
      setLocalVoting(w.window > 0);
      
      const t = await fetch("/api/teams").then((r) => r.json());
      setTeams(t.teams);
      
      const s = await fetch("/api/state").then((r) => r.json());
      setState(s);
      const activeTeam = s?.state?.activeTeam as 'R'|'G'|'B'|null;
      setLocalActive(activeTeam === null ? 'Host' : activeTeam);
      setLocalBigX(s?.state?.bigX ?? false);
      setLocalScorecard(s?.state?.scorecardOverlay ?? false);
      
      const q = await fetch("/api/questions").then((r) => r.json());
      setQuestions(q.questions ?? []);
      
      const p = await fetch("/api/round2/preview").then((r) => r.json()).catch(()=>null);
      setR2Preview(p);
      
      const sc = await fetch("/api/scores").then((r) => r.json()).catch(()=>null);
      if (sc?.totals) setTotals(sc.totals);
    };
    load();
    const id = setInterval(load, 3000); // Increased to 3s to reduce server load
    return () => clearInterval(id);
  }, []);

  async function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setImporting(true);
    setResult("");
    try {
      const res = await fetch("/api/questions/import", { method: "POST", body: fd });
      const json = await res.json();
      setResult(JSON.stringify(json));
    } catch (err: any) {
      setResult(String(err?.message || err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen p-6 space-y-6 container">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Control Panel</h1>
        {/* Header controls: Round, Active Team, Overlays */}
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-70">Round</label>
          <select
            className="border p-2 rounded"
            value={state?.state?.currentRound ?? 0}
            onChange={async (e) => {
              await fetch("/api/state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentRound: Number(e.target.value) }),
              });
              const s = await fetch("/api/state").then((r) => r.json());
              setState(s);
              const p = await fetch("/api/round2/preview").then((r) => r.json()).catch(()=>null);
              setR2Preview(p);
            }}
          >
            <option value={0}>Pre-show</option>
            <option value={1}>Round 1</option>
            <option value={2}>Round 2</option>
            <option value={3}>Round 3</option>
            <option value={4}>Final</option>
          </select>



          <div className="ml-3 flex items-center gap-2">
            <label className="flex items-center gap-2">
              <span>Big X:</span>
              <button
                className={`relative w-12 h-6 rounded-full transition-colors ${localBigX ? 'bg-red-600' : 'bg-gray-600'}`}
                onClick={async () => {
                  const newValue = !localBigX;
                  setLocalBigX(newValue); // Optimistic update
                  await fetch("/api/state", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bigX: newValue }),
                  });
                }}
              >
                <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${localBigX ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </label>
            <label className="flex items-center gap-2">
              <span>Scorecard:</span>
              <button
                className={`relative w-12 h-6 rounded-full transition-colors ${localScorecard ? 'bg-blue-600' : 'bg-gray-600'}`}
                onClick={async () => {
                  const newValue = !localScorecard;
                  setLocalScorecard(newValue); // Optimistic update
                  await fetch("/api/state", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ scorecardOverlay: newValue }),
                  });
                }}
              >
                <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${localScorecard ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </label>
          </div>
          <button
            className="ml-4 px-3 py-1 border rounded"
            onClick={async ()=>{
              if (!confirm('Reset show? This clears reveals, scores, audience, and state.')) return;
              await fetch('/api/admin/reset', { method: 'POST' });
              const s = await fetch('/api/state').then(r=>r.json());
              setState(s);
              setPendingAdjust({ R:0, G:0, B:0 });
            }}
          >Reset Show</button>
        </div>
      </div>
      {/* Live scoreboard with totals (includes applied bonuses and manual adjustments) */}
      <div className="flex gap-4 items-center text-sm">
        <div className="px-3 py-2 border rounded">R: {formatInr(totals.R)}</div>
        <div className="px-3 py-2 border rounded">G: {formatInr(totals.G)}</div>
        <div className="px-3 py-2 border rounded">B: {formatInr(totals.B)}</div>
        {r2Preview?.round === 2 && (
          <div className="ml-4 text-xs px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800">
            Projected if R2 applied now → R {formatInr(totals.R + (r2Preview.preview.R.bonus || 0))} · G {formatInr(totals.G + (r2Preview.preview.G.bonus || 0))} · B {formatInr(totals.B + (r2Preview.preview.B.bonus || 0))}
          </div>
        )}
      </div>
      <div className="flex gap-3 items-center">
        <a className="underline" href="/api/sample-csv">Download sample CSV</a>
      </div>

      <form onSubmit={handleImport} className="flex items-center gap-3" encType="multipart/form-data">
        <input name="file" type="file" accept=".csv,text/csv" className="border p-2" />
        <button disabled={importing} className="px-3 py-2 bg-black text-white rounded disabled:opacity-50">
          {importing ? "Importing…" : "Import Questions CSV"}
        </button>
      </form>

      {result && (
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-80">{result}</pre>
      )}

      <div className="border-t pt-6 space-y-3">
        <h2 className="text-lg font-semibold">Audience Voting</h2>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-70">Voting</span>
            <button
              role="switch"
              aria-checked={localVoting}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${localVoting ? 'bg-green-500' : 'bg-gray-300'}`}
              onClick={async () => {
                const newValue = !localVoting;
                setLocalVoting(newValue); // Optimistic update
                await fetch('/api/audience/window', { 
                  method: 'POST', 
                  headers: { 'Content-Type': 'application/json' }, 
                  body: JSON.stringify({ window: newValue ? 1 : 0 }) 
                });
              }}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${localVoting ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-xs px-2 py-1 rounded ${window === 1 ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-800 border border-gray-300'}`}>
              {window === 1 ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          <div className="text-sm opacity-70">Dugout: {teams.map((t) => `${t.name} ${t.dugout}`).join(' · ')}</div>
        </div>
      </div>

      <div className="border-t pt-6 space-y-3">
        <h2 className="text-lg font-semibold">Question & Reveal</h2>
        
        {/* Team Selection moved here */}
        <div className="bg-gray-50 p-3 rounded border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Active Team:</span>
            {["R","G","B","Host"].map((t)=> (
              <button
                key={t}
                className={`px-3 py-2 rounded font-medium transition-all ${localActive === t ? "bg-black text-white" : "border hover:bg-gray-100"}`}
                onClick={async ()=>{
                  // Optimistic update - immediate UI feedback
                  setLocalActive(t as any);
                  
                  try {
                    if (t !== 'Host') {
                      await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activeTeam: t }) });
                    } else {
                      // Set activeTeam to null for Host
                      await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activeTeam: null }) });
                    }
                  } catch (error) {
                    // Revert on error
                    console.error('Failed to update active team:', error);
                    const s = await fetch("/api/state").then((r) => r.json());
                    const activeTeam = s?.state?.activeTeam as 'R'|'G'|'B'|null;
                    setLocalActive(activeTeam === null ? 'Host' : activeTeam);
                  }
                }}
              >{t}</button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">Select Question:</label>
          <select
            className="border p-2"
            value={state?.state?.currentQuestionId ?? ""}
            onChange={async (e) => {
              await fetch("/api/state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentQuestionId: e.target.value || null }),
              });
              const s = await fetch("/api/state").then((r) => r.json());
              setState(s);
            }}
          >
            <option value="">-- none --</option>
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.id}: {q.text}
              </option>
            ))}
          </select>

          {/* Active team moved to header */}
        </div>

        {state?.question && (
          <div className="mt-4 space-y-2">
            <div className="font-medium">{state.question.text}</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {state.question.answers.map((a: any) => {
                const revealed = state.question.reveals?.some((r: any) => r.answerIndex === a.index);
                return (
                  <button
                    key={a.index}
                    className={`p-2 border rounded text-left transition-all ${
                      revealed 
                        ? "bg-green-100 border-green-500 text-green-800" 
                        : "hover:bg-gray-50"
                    }`}
                    onClick={async () => {
                      if (revealed) {
                        // Unreveals answer
                        await fetch("/api/reveal", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ questionId: state.question.id, answerIndex: a.index }),
                        });
                      } else {
                        // Reveal answer
                        const attribution = localActive ?? (state?.state?.activeTeam ?? "Host");
                        await fetch("/api/reveal", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ questionId: state.question.id, answerIndex: a.index, attribution }),
                        });
                      }
                      const s = await fetch("/api/state").then((r) => r.json());
                      setState(s);
                    }}
                  >
                    <div className="text-xs opacity-60">#{a.index}</div>
                    <div className="font-medium">{a.text}</div>
                  </button>
                );
              })}
            </div>
            <div className="text-sm opacity-70">Totals R/G/B: {state.totals?.R} / {state.totals?.G} / {state.totals?.B}</div>
            <div className="flex flex-wrap gap-2 items-center mt-2">
              {/* Overlays moved to header */}
              {/* Manual +/- score controls */}
              {["R", "G", "B"].map((t) => (
                <div key={t} className="flex items-center gap-1 ml-2">
                  <span className="text-xs">{t}</span>
                  <button
                    className="px-2 py-1 border rounded"
                    onClick={async () => {
                      setPendingAdjust((p) => ({ ...p, [t]: (p as any)[t] + 1000 } as any));
                      await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team: t, amount: 1000, reason: "manual +" }) });
                      const s = await fetch("/api/state").then((r) => r.json());
                      setState(s);
                    }}
                  >
                    +
                  </button>
                  <button
                    className="px-2 py-1 border rounded"
                    onClick={async () => {
                      setPendingAdjust((p) => ({ ...p, [t]: (p as any)[t] - 1000 } as any));
                      await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team: t, amount: -1000, reason: "manual -" }) });
                      const s = await fetch("/api/state").then((r) => r.json());
                      setState(s);
                    }}
                  >
                    -
                  </button>
                  {pendingAdjust[t as 'R'|'G'|'B'] !== 0 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 border border-yellow-300 text-yellow-800">
                      {pendingAdjust[t as 'R'|'G'|'B'] > 0 ? `+${pendingAdjust[t as 'R'|'G'|'B']}` : `${pendingAdjust[t as 'R'|'G'|'B']}`}
                    </span>
                  )}
                </div>
              ))}
              {/* Round 2 bonus apply */}
              <button
                className="px-2 py-1 border rounded ml-2"
                onClick={async () => {
                  const res = await fetch("/api/round2/apply-bonus", { method: "POST" });
                  const json = await res.json();
                  setResult(JSON.stringify(json));
                  const s = await fetch("/api/state").then((r) => r.json());
                  setState(s);
                  const p = await fetch("/api/round2/preview").then((r) => r.json());
                  setR2Preview(p);
                }}
              >
                Apply R2 Bonus
              </button>
              {r2Preview?.round === 2 && (
                <span className="text-xs ml-2 px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800">
                  Preview: R {r2Preview.preview.R.count}→x{r2Preview.preview.R.multiplier} (bonus {r2Preview.preview.R.bonus}) · G {r2Preview.preview.G.count}→x{r2Preview.preview.G.multiplier} (bonus {r2Preview.preview.G.bonus}) · B {r2Preview.preview.B.count}→x{r2Preview.preview.B.multiplier} (bonus {r2Preview.preview.B.bonus})
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      
    </div>
  );
}


