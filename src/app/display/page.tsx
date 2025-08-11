"use client";
import { useEffect, useState } from "react";
import { formatInr, TEAM_COLORS } from "@/lib/format";
import { io, Socket } from 'socket.io-client';
import PusherClient from 'pusher-js';

type Team = { id: "R" | "G" | "B"; name: string; colorHex: string; dugout: number };

export default function DisplayPage() {
  const [teams, setTeams] = useState<Team[]>([
    { id: "R", name: "Red Team", colorHex: "#FF3B30", dugout: 0 },
    { id: "G", name: "Green Team", colorHex: "#34C759", dugout: 0 },
    { id: "B", name: "Blue Team", colorHex: "#007AFF", dugout: 0 }
  ]);
  const [state, setState] = useState<any>(null);
  const [bump, setBump] = useState<{ team: 'R'|'G'|'B'|'Host'|'Neutral'; amount: number }|null>(null);
  const [prevRevealCount, setPrevRevealCount] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/teams", { cache: "no-store" });
        const json = await res.json();
        if (json.teams && json.teams.length > 0) {
          setTeams(json.teams);
        }
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
      } catch (error) {
        console.error('Failed to load data:', error);
      }
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
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white font-bold">
      {state?.state?.logoOnly && (
        <div className="fixed inset-0 bg-gradient-to-b from-blue-900 to-blue-700 z-50 flex items-center justify-center">
          <div className="text-6xl font-black text-yellow-400 tracking-wider animate-pulse">AKAL KE GHODE</div>
        </div>
      )}
      
      {/* Fixed Family Feud style scoreboard */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 border-b-4 border-yellow-600 shadow-lg">
        <ScoreRail teams={teams} state={state} />
      </div>
      
      {state?.question ? (
        <div className="pt-20 pb-8">
          {/* Question header with Family Feud styling */}
          <div className="text-center mb-8 px-6">
            <div className="bg-blue-700 border-4 border-yellow-400 rounded-lg mx-auto max-w-4xl p-6 shadow-2xl">
              <div className="text-yellow-300 text-lg mb-2 tracking-wider">SURVEY SAYS...</div>
              <div className="text-white text-2xl md:text-3xl font-black tracking-wide leading-tight">
                {state.question.text}
              </div>
            </div>
          </div>
          
          {/* Family Feud style answer board */}
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.question.answers.map((a: any, idx: number) => {
                const reveal = state.question.reveals?.find((r: any) => r.answerIndex === a.index);
                const attributed = reveal?.attribution;
                const teamColor = attributed && TEAM_COLORS[attributed] ? TEAM_COLORS[attributed] : "#6B7280";
                const revealed = Boolean(reveal);
                
                return (
                  <div
                    key={a.index}
                    className={`relative bg-blue-800 border-4 rounded-lg shadow-xl transition-all duration-500 ${
                      revealed 
                        ? "border-yellow-400 bg-gradient-to-r from-blue-700 to-blue-600" 
                        : "border-blue-600 bg-blue-800/50"
                    }`}
                    style={{
                      minHeight: "80px",
                      backgroundImage: revealed ? `linear-gradient(45deg, ${teamColor}22, transparent)` : undefined
                    }}
                  >
                    {/* Answer number circle */}
                    <div className={`absolute -left-3 -top-3 w-8 h-8 rounded-full border-3 flex items-center justify-center text-sm font-black ${
                      revealed 
                        ? "bg-yellow-400 border-yellow-600 text-blue-900" 
                        : "bg-blue-600 border-blue-400 text-white"
                    }`}>
                      {a.index}
                    </div>
                    
                    <div className="p-4 flex justify-between items-center h-full">
                      <div className={`text-left flex-1 ${revealed ? "text-white" : "text-transparent"}`}>
                        <div className={`text-lg md:text-xl font-black tracking-wide ${revealed ? "" : "blur-sm select-none"}`}>
                          {revealed ? a.text.toUpperCase() : "████████████"}
                        </div>
                      </div>
                      
                      {/* Score display Family Feud style */}
                      <div className={`text-right ${revealed ? "opacity-100" : "opacity-0"}`}>
                        <div className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full font-black text-lg border-2 border-yellow-600">
                          {revealed ? formatInr(a.value) : ""}
                        </div>
                      </div>
                    </div>
                    
                    {/* Team attribution stripe */}
                    {revealed && attributed && TEAM_COLORS[attributed] && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-2 rounded-b-md"
                        style={{ backgroundColor: teamColor }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-6xl font-black text-yellow-400 mb-4 animate-pulse">AKAL KE GHODE</div>
            <div className="text-2xl text-blue-200">Waiting for question...</div>
          </div>
        </div>
      )}

      {/* Family Feud style overlays */}
      {state?.state?.bigX && (
        <div className="fixed inset-0 z-40 bg-red-900/80 flex items-center justify-center">
          <div className="relative">
            <div className="text-red-100 text-[25vw] font-black select-none animate-pulse drop-shadow-2xl">✗</div>
            <div className="absolute inset-0 text-red-600 text-[25vw] font-black select-none animate-ping">✗</div>
          </div>
        </div>
      )}
      {state?.state?.scorecardOverlay && (
        <div className="fixed inset-0 z-[999] bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
          <div className="w-[90%] max-w-6xl bg-yellow-400 border-8 border-blue-900 rounded-xl p-8 shadow-2xl">
            <div className="text-center text-4xl font-black text-blue-900 mb-6 tracking-wider">
              📊 FINAL SCORECARD 📊
            </div>
            <div className="bg-blue-900 rounded-lg p-4">
              <ScoreRail teams={teams} state={state} />
            </div>
          </div>
        </div>
      )}
      {/* Family Feud style score bump */}
      {bump && bump.amount > 0 && (bump.team === 'R' || bump.team === 'G' || bump.team === 'B') && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className="relative">
            <div 
              className="text-6xl md:text-8xl font-black animate-bounce drop-shadow-2xl"
              style={{ color: TEAM_COLORS[bump.team] }}
            >
              +{formatInr(bump.amount)}
            </div>
            <div className="absolute inset-0 bg-yellow-400 text-blue-900 text-6xl md:text-8xl font-black animate-ping opacity-50">
              +{formatInr(bump.amount)}
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
      try {
        const json = await fetch('/api/scores', { cache: 'no-store' }).then(r=>r.json());
        if (json.totals) {
          setTotals(json.totals);
        }
      } catch (error) {
        console.error('Failed to load scores:', error);
      }
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
    <div className="p-3 flex gap-6 justify-center flex-wrap">
      {teams.map((t) => {
        const isActive = state?.state?.activeTeam === t.id;
        const teamScore = t.id === 'R' ? totals.R : t.id === 'G' ? totals.G : totals.B;
        return (
          <div key={t.id} className={`relative flex items-center gap-3 px-4 py-2 ${isActive ? 'transform scale-105' : ''} transition-all duration-300`}>
            {/* Family Feud style team display */}
            <div className="bg-blue-900 border-3 border-yellow-400 rounded-lg px-4 py-2 shadow-lg">
              <div className="text-center">
                <div className="text-lg font-black tracking-wider" style={{ color: t.colorHex }}>
                  {t.name.toUpperCase()}
                </div>
                <div className="flex gap-2 mt-1">
                  <div className="bg-yellow-400 text-blue-900 px-2 py-1 rounded text-xs font-bold">
                    Dugout: {t.dugout}
                  </div>
                  <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                    {formatInr(teamScore)}
                  </div>
                </div>
                {isActive && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-black animate-pulse border-2 border-yellow-400">
                    PLAYING
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


