"use client";
import { useEffect, useState } from "react";
import { formatInr, TEAM_COLORS } from "@/lib/format";
import { io, Socket } from 'socket.io-client';
import PusherClient from 'pusher-js';

type Team = { id: "R" | "G" | "B"; name: string; colorHex: string; dugout: number };

export default function DisplayPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [state, setState] = useState<any>(null);
  const [bump, setBump] = useState<{ team: 'R'|'G'|'B'|'Host'|'Neutral'; amount: number }|null>(null);
  const [prevRevealCount, setPrevRevealCount] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/teams", { cache: "no-store" });
      const json = await res.json();
      setTeams(json.teams);
      const s = await fetch("/api/state", { cache: "no-store" }).then((r) => r.json());
      // bump detection
      const reveals = s?.question?.reveals ?? [];
      if (reveals.length > prevRevealCount) {
        const last = reveals.reduce((a: any, b: any) => (new Date(a.createdAt) > new Date(b.createdAt) ? a : b));
        const ans = s.question.answers.find((a: any) => a.index === last.answerIndex);
        setBump({ team: last.attribution, amount: ans?.value ?? 0 });
        setTimeout(() => setBump(null), 1200);
      }
      setPrevRevealCount(reveals.length);
      setState(s);
    };
    load();
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

  return (
    <div className="min-h-screen bg-black text-white">
      {state?.state?.logoOnly && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="text-4xl font-bold">LOGO</div>
        </div>
      )}
      {/* Fixed mini-score always visible */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black/50 backdrop-blur-sm">
        <ScoreRail teams={teams} state={state} />
      </div>
      {state?.question ? (
        <div className="max-w-5xl mx-auto px-6 mt-24">
          <div className="text-center text-xl font-semibold mb-4">{state.question.text}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {state.question.answers.map((a: any) => {
              const reveal = state.question.reveals?.find((r: any) => r.answerIndex === a.index);
              const attributed = reveal?.attribution;
              const color = attributed && TEAM_COLORS[attributed] ? TEAM_COLORS[attributed] : "#9CA3AF"; // grey for Host/Neutral
              const revealed = Boolean(reveal);
              return (
                <div
                  key={a.index}
                  className={`p-4 rounded border ${revealed ? "bg-white/10" : "bg-white/5"}`}
                  style={{ borderColor: revealed ? color : "#374151" }}
                >
                  <div className="text-xs opacity-60">#{a.index}</div>
                  <div className={`font-semibold ${revealed ? "" : "blur-sm"}`}>{a.text}</div>
                  <div className="opacity-80 mt-1">{revealed ? formatInr(a.value) : ""}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center mt-24 opacity-70">No question loaded…</div>
      )}

      {/* Overlays */}
      {state?.state?.bigX && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center">
          <div className="text-red-600 text-[20vw] font-extrabold select-none">X</div>
        </div>
      )}
      {state?.state?.scorecardOverlay && (
        <div className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center">
          <div className="w-[85%] max-w-6xl bg-white/10 border border-white/30 rounded-lg p-6">
            <div className="text-center text-3xl font-bold mb-4">Scorecard</div>
            <ScoreRail teams={teams} state={state} />
          </div>
        </div>
      )}
      {/* Score bump overlay */}
      {bump && bump.amount > 0 && (bump.team === 'R' || bump.team === 'G' || bump.team === 'B') && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-start justify-center pt-24">
          <div className="text-5xl font-extrabold" style={{ color: TEAM_COLORS[bump.team] }}>
            +{formatInr(bump.amount)}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreRail({ teams, state }: { teams: Team[]; state: any }) {
  const [totals, setTotals] = useState<{ R: number; G: number; B: number }>({ R: 0, G: 0, B: 0 });

  useEffect(() => {
    const load = async () => {
      const json = await fetch('/api/scores', { cache: 'no-store' }).then(r=>r.json());
      setTotals(json.totals);
    };
    load();
    const refresh = () => load();
    if (process.env.NODE_ENV === 'development') {
      fetch('/api/socketio');
      const socket: Socket = io({ path: '/api/socketio' });
      socket.on('reveal', refresh);
      socket.on('scores:update', refresh);
      socket.on('audience:update', refresh);
      return () => { socket.close(); };
    } else {
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY as string;
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string;
      const pusher = new PusherClient(key, { cluster });
      const channel = pusher.subscribe('show');
      channel.bind('reveal', refresh);
      channel.bind('scores:update', refresh);
      channel.bind('audience:update', refresh);
      return () => { channel.unbind_all(); channel.unsubscribe(); pusher.disconnect(); };
    }
  }, []);

  return (
    <div className="p-4 flex gap-6 justify-center">
      {teams.map((t) => {
        const isActive = state?.state?.activeTeam === t.id;
        return (
          <div key={t.id} className={`flex items-center gap-3 px-3 py-1 rounded ${isActive ? 'ring-2 ring-yellow-400' : ''}`}>
            <div className="text-2xl font-bold" style={{ color: t.colorHex }}>
              {t.name}
            </div>
            <div className="px-3 py-1 rounded bg-white/10">Dugout: {t.dugout}</div>
            <div className="px-3 py-1 rounded bg-white/10">{formatInr(t.id === 'R' ? totals.R : t.id === 'G' ? totals.G : totals.B)}</div>
            {isActive && <div className="px-2 py-1 bg-yellow-500 text-black rounded">Turn</div>}
          </div>
        );
      })}
    </div>
  );
}


