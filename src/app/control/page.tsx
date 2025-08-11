"use client";
import { useState, useEffect } from "react";
import { formatInr } from "@/lib/format";
import { io, Socket } from 'socket.io-client';
import PusherClient from 'pusher-js';

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
      try {
        // Single unified API call for maximum speed
        const dashboard = await fetch("/api/dashboard").then((r) => r.json()).catch(() => ({
          state: { state: null, question: null },
          teams: [],
          questions: [],
          totals: { R: 0, G: 0, B: 0 },
          window: 0,
          r2Preview: null
        }));

        // Update all state from unified response
        setWindow(dashboard.window);
        setLocalVoting(dashboard.window > 0);
        setTeams(dashboard.teams);
        setState(dashboard.state);
        
        // Only sync from server if we don't have a local override
        const activeTeam = dashboard.state?.state?.activeTeam as 'R'|'G'|'B'|null;
        const serverActive = activeTeam === null ? 'Host' : activeTeam;
        // Only update if local hasn't been set by user interaction
        if (localActive === 'Host' && serverActive !== 'Host') {
          setLocalActive(serverActive);
        }
        setLocalBigX(dashboard.state?.state?.bigX ?? false);
        setLocalScorecard(dashboard.state?.state?.scorecardOverlay ?? false);
        
        setQuestions(dashboard.questions ?? []);
        setR2Preview(dashboard.r2Preview);
        setTotals(dashboard.totals);
      } catch (error) {
        console.error('Failed to load control panel data:', error);
      }
    };
    load();
    
    // Real-time WebSocket updates for instant sync
    const refresh = () => load();
    if (process.env.NODE_ENV === 'development') {
      fetch('/api/socketio');
      const socket: Socket = io({ path: '/api/socketio' });
      socket.on('state:update', refresh);
      socket.on('reveal', refresh);
      socket.on('scores:update', refresh);
      socket.on('audience:update', refresh);
      return () => { socket.close(); };
    } else {
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY as string;
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string;
      const pusher = new PusherClient(key, { cluster });
      const channel = pusher.subscribe('show');
      channel.bind('state:update', refresh);
      channel.bind('reveal', refresh);
      channel.bind('scores:update', refresh);
      channel.bind('audience:update', refresh);
      return () => { channel.unbind_all(); channel.unsubscribe(); pusher.disconnect(); };
    }
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
      
      // CRITICAL FIX: Reload dashboard data after successful import
      if (json.imported && json.imported > 0) {
        const dashboard = await fetch("/api/dashboard").then((r) => r.json()).catch(() => ({}));
        if (dashboard.questions) {
          setQuestions(dashboard.questions);
          setResult(`✅ Successfully imported ${json.imported} questions! Dropdown updated.`);
        }
      }
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
              // State will update via WebSocket automatically
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
              setPendingAdjust({ R:0, G:0, B:0 });
              // State will update via WebSocket automatically
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
        <button 
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          onClick={async () => {
            const res = await fetch("/api/questions");
            const json = await res.json();
            setResult(`🔍 Database Check: ${json.count} questions found\n${JSON.stringify(json.debug, null, 2)}`);
          }}
        >
          Check Database
        </button>
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
          <button 
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            onClick={async () => {
              const dashboard = await fetch("/api/dashboard").then((r) => r.json()).catch(() => ({}));
              if (dashboard.questions) {
                setQuestions(dashboard.questions);
                setResult(`🔄 Refreshed: Found ${dashboard.questions.length} questions`);
              }
            }}
          >
            Refresh
          </button>
          <select
            className="border p-2"
            value={state?.state?.currentQuestionId ?? ""}
            onChange={async (e) => {
              // IMMEDIATE UI feedback - don't wait for server
              const newQuestionId = e.target.value || null;
              setState((prev: any) => ({
                ...prev,
                state: { ...prev?.state, currentQuestionId: newQuestionId }
              }));
              
              // Background API call
              fetch("/api/state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentQuestionId: newQuestionId }),
              }).catch(console.error);
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
            <div className="grid grid-cols-1 gap-3">
              {state.question.answers.map((a: any) => {
                const revealed = state.question.reveals?.some((r: any) => r.answerIndex === a.index);
                return (
                  <div key={a.index} className={`p-3 border rounded transition-all ${
                    revealed 
                      ? "bg-green-100 border-green-500" 
                      : "bg-gray-50"
                  }`}>
                    <div className="flex items-center justify-between gap-3">
                      {/* Answer text */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs opacity-60">#{a.index}</span>
                          <span className="font-medium">{a.text}</span>
                        </div>
                      </div>
                      
                      {/* Amount input field */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">₹</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          className="w-24 px-2 py-1 border rounded text-sm"
                          defaultValue={a.value}
                          onBlur={async (e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            if (newValue !== a.value) {
                              await fetch("/api/answers/update", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  questionId: state.question.id, 
                                  answerIndex: a.index, 
                                  value: newValue 
                                }),
                              });
                            }
                          }}
                        />
                      </div>
                      
                      {/* Reveal/Hide button */}
                      <button
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          revealed 
                            ? "bg-red-600 text-white hover:bg-red-700" 
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                        onClick={async () => {
                          // IMMEDIATE UI feedback
                          const currentReveals = state.question.reveals || [];
                          
                          if (revealed) {
                            // Optimistically remove reveal
                            const newReveals = currentReveals.filter((r: any) => r.answerIndex !== a.index);
                            setState((prev: any) => ({
                              ...prev,
                              question: { ...prev.question, reveals: newReveals }
                            }));
                            
                            // Background API call
                            fetch("/api/reveal", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ questionId: state.question.id, answerIndex: a.index }),
                            }).catch(console.error);
                          } else {
                            // Optimistically add reveal
                            const attribution = localActive ?? (state?.state?.activeTeam ?? "Host");
                            const newReveal = { questionId: state.question.id, answerIndex: a.index, attribution, createdAt: new Date().toISOString() };
                            const newReveals = [...currentReveals, newReveal];
                            setState((prev: any) => ({
                              ...prev,
                              question: { ...prev.question, reveals: newReveals }
                            }));
                            
                            // Background API call
                            fetch("/api/reveal", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ questionId: state.question.id, answerIndex: a.index, attribution }),
                            }).catch(console.error);
                          }
                        }}
                      >
                        {revealed ? "Hide" : "Reveal"}
                      </button>
                    </div>
                  </div>
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
                      // State will update via WebSocket automatically
                    }}
                  >
                    +
                  </button>
                  <button
                    className="px-2 py-1 border rounded"
                    onClick={async () => {
                      setPendingAdjust((p) => ({ ...p, [t]: (p as any)[t] - 1000 } as any));
                      await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team: t, amount: -1000, reason: "manual -" }) });
                      // State will update via WebSocket automatically
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

            </div>
          </div>
        )}
        
        {/* Manual Round 2 Bonus Section */}
        {state?.state?.currentRound === 2 && !state?.state?.round2BonusApplied && (
          <div className="mt-6 p-4 border rounded bg-blue-50">
            <h3 className="text-lg font-semibold mb-3">Round 2 Manual Bonus</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {["R", "G", "B"].map((team) => (
                <div key={team} className="flex flex-col">
                  <label className="text-sm font-medium mb-1">{team} Team Bonus:</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    className="px-3 py-2 border rounded"
                    id={`r2-bonus-${team}`}
                  />
                </div>
              ))}
            </div>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={async () => {
                const r = parseInt((document.getElementById('r2-bonus-R') as HTMLInputElement)?.value) || 0;
                const g = parseInt((document.getElementById('r2-bonus-G') as HTMLInputElement)?.value) || 0;
                const b = parseInt((document.getElementById('r2-bonus-B') as HTMLInputElement)?.value) || 0;
                
                if (r === 0 && g === 0 && b === 0) {
                  alert('Please enter at least one bonus amount');
                  return;
                }
                
                if (!confirm(`Apply R2 bonuses: R ₹${r}, G ₹${g}, B ₹${b}?`)) return;
                
                const res = await fetch("/api/round2/manual-bonus", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ teamBonuses: { R: r, G: g, B: b } }),
                });
                
                const json = await res.json();
                if (json.ok) {
                  setResult(`R2 Manual Bonus Applied: ${JSON.stringify(json.applied)}`);
                } else {
                  setResult(`Error: ${json.error}`);
                }
              }}
            >
              Apply Manual R2 Bonus
            </button>
          </div>
        )}
        
        {state?.state?.round2BonusApplied && (
          <div className="mt-4 p-3 border rounded bg-green-50 text-green-800">
            ✅ Round 2 bonus has been applied
          </div>
        )}
      </div>

      
    </div>
  );
}


