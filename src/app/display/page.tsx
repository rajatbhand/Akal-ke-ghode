"use client";
import { useEffect, useState } from "react";
import { formatInr, TEAM_COLORS } from "@/lib/format";
import { io, Socket } from 'socket.io-client';
import PusherClient from 'pusher-js';

type Team = { id: "R" | "G" | "B"; name: string; colorHex: string; dugout: number };

export default function DisplayPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/teams", { cache: "no-store" });
      const json = await res.json();
      setTeams(json.teams);
      const s = await fetch("/api/state", { cache: "no-store" }).then((r) => r.json());
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
      <ScoreRail teams={teams} state={state} />
      {state?.question ? (
        <div className="max-w-5xl mx-auto px-6">
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
        <div className="flex items-center justify-center mt-10 opacity-70">No question loaded…</div>
      )}

      {/* Overlays */}
      {state?.state?.bigX && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center">
          <div className="text-red-600 text-[20vw] font-extrabold select-none">X</div>
        </div>
      )}
      {state?.state?.scorecardOverlay && (
        <div className="fixed inset-0 z-30 bg-black/80 flex items-center justify-center">
          <div className="bg-white/10 border border-white/20 rounded p-8 min-w-[60%]">
            <div className="text-center text-2xl font-bold mb-6">Scorecard</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {teams.map((t) => (
                <div key={t.id} className="p-4 rounded bg-white/5">
                  <div className="text-xl font-semibold" style={{ color: t.colorHex }}>{t.name}</div>
                  <div className="text-lg mt-2">Dugout: {t.dugout}</div>
                </div>
              ))}
            </div>
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
      {teams.map((t) => (
        <div key={t.id} className="flex items-center gap-3">
          <div className="text-2xl font-bold" style={{ color: t.colorHex }}>
            {t.name}
          </div>
          <div className="px-3 py-1 rounded bg-white/10">Dugout: {t.dugout}</div>
          <div className="px-3 py-1 rounded bg-white/10">{formatInr(t.id === 'R' ? totals.R : t.id === 'G' ? totals.G : totals.B)}</div>
          {state?.state?.activeTeam === t.id && (
            <div className="px-2 py-1 bg-yellow-500 text-black rounded">Turn</div>
          )}
        </div>
      ))}
    </div>
  );
}


