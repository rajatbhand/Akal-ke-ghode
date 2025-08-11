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
        // bump detection - only for new team reveals, not on general reloads
        const reveals = s?.question?.reveals ?? [];
        if (reveals.length > prevRevealCount && prevRevealCount > 0) { // Only if we had previous data
          const last = reveals.reduce((a: any, b: any) => (new Date(a.createdAt) > new Date(b.createdAt) ? a : b));
          const ans = s.question.answers.find((a: any) => a.index === last.answerIndex);
          // Only show bump for actual team attributions (R, G, B) not Host/Neutral
          if (last.attribution === 'R' || last.attribution === 'G' || last.attribution === 'B') {
            setBump({ team: last.attribution, amount: ans?.value ?? 0 });
            setTimeout(() => setBump(null), 1200);
          }
        }
        setPrevRevealCount(reveals.length);
        setState(s);
        
        // Clear bump if Big X is showing or on general state updates to prevent interference
        if (s?.state?.bigX || (reveals.length === prevRevealCount && prevRevealCount > 0)) {
          setBump(null);
        }
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
  }, [prevRevealCount]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white font-bold">
      {state?.state?.logoOnly && (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-gray-700 z-50 flex items-center justify-center">
          <div className="text-6xl font-black text-purple-400 tracking-wider animate-pulse">AKAL KE GHODE</div>
        </div>
      )}
      
      {/* Fixed neutral scoreboard - optimized for 16:9 TV */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b-4 border-purple-600 shadow-lg">
        <ScoreRail teams={teams} state={state} />
      </div>
      
      {state?.question ? (
        <div className="pt-24 pb-6 min-h-screen flex flex-col">
          {/* Question header - positioned for 16:9 TV */}
          <div className="text-center mb-6 px-8">
            <div className="bg-gray-800 border-4 border-purple-500 rounded-lg mx-auto max-w-5xl p-4 shadow-2xl">
              <div className="text-purple-300 text-base mb-1 tracking-wider">QUESTION</div>
              <div className="text-white text-xl md:text-2xl font-black tracking-wide leading-tight">
                {state.question.text}
              </div>
            </div>
          </div>
          
          {/* Answer board - optimized for 16:9 TV display */}
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-7xl">
              <div className="grid grid-cols-2 gap-4">
                {state.question.answers
                  .sort((a: any, b: any) => a.index - b.index) // Always display in Z-eye pattern order (1,2,3...)
                  .map((a: any, displayIndex: number) => {
                  const reveal = state.question.reveals?.find((r: any) => r.answerIndex === a.index);
                  const attributed = reveal?.attribution;
                  const teamColor = attributed && TEAM_COLORS[attributed] ? TEAM_COLORS[attributed] : "#6B7280"; // grey for Host
                  const revealed = Boolean(reveal);
                  
                  return (
                    <div
                      key={a.index}
                      className={`relative bg-gray-800 border-4 rounded-lg shadow-xl transition-all duration-500`}
                      style={{
                        minHeight: "100px",
                        borderColor: revealed ? teamColor : "#4B5563" // team color outline when revealed, grey when hidden
                      }}
                    >
                      <div className="p-6 flex justify-between items-center h-full">
                        <div className={`text-left flex-1 ${revealed ? "text-white" : "text-transparent"}`}>
                          <div className={`text-lg md:text-xl font-black tracking-wide ${revealed ? "" : "blur-sm select-none"}`}>
                            {revealed ? a.text.toUpperCase() : "████████████"}
                          </div>
                        </div>
                        
                        {/* Score display with neutral styling - larger for TV */}
                        <div className={`text-right ${revealed ? "opacity-100" : "opacity-0"}`}>
                          <div className="bg-white text-black px-4 py-2 rounded-full font-black text-xl border-2 border-gray-300">
                            {revealed ? formatInr(a.value) : ""}
                          </div>
                        </div>
                      </div>
                      
                      {/* Team attribution stripe at bottom */}
                      {revealed && attributed && (
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
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-6xl font-black text-purple-400 mb-4 animate-pulse">AKAL KE GHODE</div>
            <div className="text-2xl text-gray-300">Waiting for question...</div>
          </div>
        </div>
      )}

      {/* Neutral style overlays */}
      {state?.state?.bigX && (
        <div className="fixed inset-0 z-40 bg-red-900/80 flex items-center justify-center">
          <div className="relative">
            <div className="text-red-100 text-[25vw] font-black select-none animate-pulse drop-shadow-2xl">✗</div>
            <div className="absolute inset-0 text-red-600 text-[25vw] font-black select-none animate-ping">✗</div>
          </div>
        </div>
      )}
      {state?.state?.scorecardOverlay && (
        <div className="fixed inset-0 z-[999] bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
          <div className="w-[90%] max-w-6xl bg-white border-8 border-purple-600 rounded-xl p-8 shadow-2xl">
            <div className="text-center text-4xl font-black text-gray-900 mb-6 tracking-wider">
              📊 FINAL SCORECARD 📊
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <ScoreRail teams={teams} state={state} />
            </div>
          </div>
        </div>
      )}
      {/* Neutral style score bump */}
      {bump && bump.amount > 0 && (bump.team === 'R' || bump.team === 'G' || bump.team === 'B') && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className="relative">
            <div 
              className="text-6xl md:text-8xl font-black animate-bounce drop-shadow-2xl"
              style={{ color: TEAM_COLORS[bump.team] }}
            >
              +{formatInr(bump.amount)}
            </div>
            <div className="absolute inset-0 bg-white text-black text-6xl md:text-8xl font-black animate-ping opacity-50">
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
            {/* Neutral style team display */}
            <div className="bg-gray-800 border-3 border-purple-500 rounded-lg px-4 py-2 shadow-lg">
              <div className="text-center">
                <div className="text-lg font-black tracking-wider" style={{ color: t.colorHex }}>
                  {t.name.toUpperCase()}
                </div>
                <div className="flex gap-2 mt-1">
                  <div className="bg-white text-black px-2 py-1 rounded text-xs font-bold">
                    Dugout: {t.dugout}
                  </div>
                  <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                    {formatInr(teamScore)}
                  </div>
                </div>
                {isActive && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-black animate-pulse border-2 border-purple-400">
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