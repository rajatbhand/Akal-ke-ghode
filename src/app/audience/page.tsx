"use client";
import { useEffect, useState } from "react";

export default function AudiencePage() {
  const [windowOpen, setWindowOpen] = useState<number>(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [team, setTeam] = useState<'R'|'G'|'B'|'none'>('none');
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const w = await fetch('/api/audience/window').then(r=>r.json());
      setWindowOpen(w.window);
    };
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  async function submit() {
    setMessage("");
    if (windowOpen !== 1) { setMessage("Voting is closed"); return; }
    if (!name || !phone || team==='none') { setMessage("Please fill all fields and select a team"); return; }
    const res = await fetch('/api/audience/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone, team }) });
    const json = await res.json();
    if (!res.ok) { setMessage(json.error || 'Error'); return; }
    setMessage('Locked: TEAM ' + team);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded p-5 space-y-3">
        <h1 className="text-xl font-bold text-center">Choose Your Team</h1>
        {windowOpen !== 1 && (
          <div className="text-center text-sm p-2 rounded bg-gray-100 border">Voting is currently closed</div>
        )}
        <input className="w-full border p-2 rounded" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Phone" value={phone} onChange={(e)=>setPhone(e.target.value)} />
        <div className="flex items-center justify-between">
          {(['R','G','B'] as const).map((t)=> (
            <button key={t} onClick={()=>setTeam(t)} className={`px-4 py-3 rounded border ${team===t? 'bg-black text-white': ''}`}>{t}</button>
          ))}
        </div>
        <button onClick={submit} className="w-full px-4 py-2 bg-black text-white rounded">Submit</button>
        {message && <div className="text-center text-sm p-2 rounded bg-blue-50 border border-blue-200">{message}</div>}
      </div>
    </div>
  );
}


