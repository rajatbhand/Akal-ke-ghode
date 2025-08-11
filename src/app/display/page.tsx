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
  const [totals, setTotals] = useState<{ R: number; G: number; B: number }>({ R: 0, G: 0, B: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        // Single optimized API call - much faster than separate calls
        const dashboard = await fetch("/api/dashboard", { cache: "no-store" }).then((r) => r.json());
        
        // Update teams with dugout counts
        if (dashboard.teams && dashboard.teams.length > 0) {
          setTeams(dashboard.teams);
        }
        
        // Update totals from dashboard
        if (dashboard.totals) {
          setTotals(dashboard.totals);
        }
        
        // Update state
        const s = dashboard.state;
        const reveals = s?.question?.reveals ?? [];
        
        // bump detection - only for new team reveals, not on general reloads
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white font-bold overflow-hidden">
      {state?.state?.logoOnly && (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-gray-700 z-50 flex items-center justify-center">
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-purple-400 tracking-wider animate-pulse">AKAL KE GHODE</div>
        </div>
      )}
      
      {/* Fixed bigger scoreboard - positioned on right side, responsive */}
      <div className="fixed top-0 right-0 z-40 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-800 border-l-4 border-b-4 border-purple-600 shadow-lg rounded-bl-lg hidden sm:block">
        <ScoreRail teams={teams} state={state} totals={totals} />
      </div>
      
      {/* Mobile scoreboard - top center for small screens */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b-4 border-purple-600 shadow-lg sm:hidden">
        <ScoreRailMobile teams={teams} state={state} totals={totals} />
      </div>
      
      {state?.question ? (
        <div className="pt-20 sm:pt-4 pb-6 pr-0 sm:pr-80 min-h-screen flex flex-col">
          {/* Question header - responsive with minimal gap */}
          <div className="text-center mb-1 sm:mb-2 px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-800 border-4 border-purple-500 rounded-lg mx-auto max-w-5xl p-2 sm:p-3 lg:p-4 shadow-2xl">
              <div className="text-purple-300 text-sm sm:text-base mb-0.5 tracking-wider">QUESTION</div>
              <div className="text-white text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black tracking-wide leading-tight">
                {state.question.text}
              </div>
            </div>
          </div>
          
          {/* Answer board - responsive design with reduced top spacing */}
          <div className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 pt-2">
            <div className="w-full max-w-6xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
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
                        minHeight: "80px",
                        borderColor: revealed ? teamColor : "#4B5563" // team color outline when revealed, grey when hidden
                      }}
                    >
                      <div className="p-3 sm:p-4 lg:p-6 flex justify-between items-center h-full">
                        <div className={`text-left flex-1 ${revealed ? "text-white" : "text-transparent"}`}>
                          <div className={`text-sm sm:text-base lg:text-lg xl:text-xl font-black tracking-wide ${revealed ? "" : "blur-sm select-none"}`}>
                            {revealed ? a.text.toUpperCase() : "████████████"}
                          </div>
                        </div>
                        
                        {/* Score display with neutral styling - responsive */}
                        <div className={`text-right ${revealed ? "opacity-100" : "opacity-0"}`}>
                          <div className="bg-white text-black px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-full font-black text-sm sm:text-base lg:text-lg xl:text-xl border-2 border-gray-300">
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
        <div className="flex items-center justify-center h-screen pr-0 sm:pr-80">
          <div className="text-center px-4">
            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-purple-400 mb-4 animate-pulse">AKAL KE GHODE</div>
            <div className="text-lg sm:text-xl lg:text-2xl text-gray-300">Waiting for question...</div>
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
              <ScoreRail teams={teams} state={state} totals={totals} />
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

function ScoreRail({ teams, state, totals }: { teams: Team[]; state: any; totals?: { R: number; G: number; B: number } }) {
  const [localTotals, setLocalTotals] = useState<{ R: number; G: number; B: number }>({ R: 0, G: 0, B: 0 });

  // Use passed totals if available, otherwise fetch separately (fallback)
  useEffect(() => {
    if (totals) {
      setLocalTotals(totals);
      return;
    }
    
    const load = async () => {
      try {
        const json = await fetch('/api/scores', { cache: 'no-store' }).then(r=>r.json());
        if (json.totals) {
          setLocalTotals(json.totals);
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
  }, [totals]);

  return (
    <div className="p-4 flex flex-col gap-4 min-w-[300px]">
      {teams.map((t) => {
        const isActive = state?.state?.activeTeam === t.id;
        const teamScore = t.id === 'R' ? localTotals.R : t.id === 'G' ? localTotals.G : localTotals.B;
        return (
          <div key={t.id} className={`relative ${isActive ? 'transform scale-105' : ''} transition-all duration-300`}>
            {/* Bigger horizontal team display */}
            <div className="bg-gray-800 border-3 border-purple-500 rounded-lg px-6 py-4 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xl font-black tracking-wider mb-2" style={{ color: t.colorHex }}>
                    {t.name.toUpperCase()}
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-white text-black px-3 py-1 rounded text-sm font-bold">
                      Dugout: {t.dugout}
                    </div>
                    <div className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-bold">
                      {formatInr(teamScore)}
                    </div>
                  </div>
                </div>
                {isActive && (
                  <div className="bg-red-600 text-white px-3 py-2 rounded-full text-sm font-black animate-pulse border-2 border-purple-400">
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

function ScoreRailMobile({ teams, state, totals }: { teams: Team[]; state: any; totals?: { R: number; G: number; B: number } }) {
  const [localTotals, setLocalTotals] = useState<{ R: number; G: number; B: number }>({ R: 0, G: 0, B: 0 });

  // Use passed totals if available, otherwise fetch separately (fallback)
  useEffect(() => {
    if (totals) {
      setLocalTotals(totals);
      return;
    }
    
    const load = async () => {
      try {
        const json = await fetch('/api/scores', { cache: 'no-store' }).then(r=>r.json());
        if (json.totals) {
          setLocalTotals(json.totals);
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
  }, [totals]);

  return (
    <div className="p-2 flex gap-1 justify-center overflow-x-auto">
      {teams.map((t) => {
        const isActive = state?.state?.activeTeam === t.id;
        const teamScore = t.id === 'R' ? localTotals.R : t.id === 'G' ? localTotals.G : localTotals.B;
        return (
          <div key={t.id} className={`relative flex-shrink-0 ${isActive ? 'transform scale-105' : ''} transition-all duration-300`}>
            {/* Compact mobile team display */}
            <div className="bg-gray-800 border-2 border-purple-500 rounded-lg px-2 py-1 shadow-lg">
              <div className="text-center">
                <div className="text-xs font-black tracking-wide" style={{ color: t.colorHex }}>
                  {t.id}
                </div>
                <div className="flex gap-1 mt-1">
                  <div className="bg-white text-black px-1 py-0.5 rounded text-xs font-bold">
                    {t.dugout}
                  </div>
                  <div className="bg-purple-600 text-white px-1 py-0.5 rounded text-xs font-bold">
                    ₹{Math.round(localTotals[t.id as keyof typeof localTotals]/1000)}k
                  </div>
                </div>
                {isActive && (
                  <div className="absolute -top-1 -right-1 bg-red-600 text-white px-1 py-0.5 rounded-full text-xs font-black animate-pulse">
                    •
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