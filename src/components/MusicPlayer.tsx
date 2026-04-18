import { useEffect, useRef, useState } from 'react';
import { Play, Square, Volume2, VolumeX } from 'lucide-react';

const TRACKS = [
  { id: 1, title: 'Neon Pulse Theory', type: 'arpeggio', meta: '128 BPM // 02:44' },
  { id: 2, title: 'Glitch Horizon', type: 'random', meta: '142 BPM // 03:12' },
  { id: 3, title: 'Cyber Sunset', type: 'drone', meta: '95 BPM // 04:01' }
];

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const playIntervalRef = useRef<number | NodeJS.Timeout | null>(null);

  const stopAudio = () => {
    oscillatorsRef.current.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    oscillatorsRef.current = [];
    if (playIntervalRef.current) clearInterval(playIntervalRef.current as any);
  };

  const playDrone = (ctx: AudioContext, gain: GainNode) => {
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, ctx.currentTime); 
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(110, ctx.currentTime);
    
    osc1.connect(gain);
    osc2.connect(gain);
    osc1.start();
    osc2.start();
    oscillatorsRef.current.push(osc1, osc2);

    let lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;
    let lfoGain = ctx.createGain();
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain);
    lfoGain.connect(osc2.frequency);
    lfo.start();
    oscillatorsRef.current.push(lfo);
  };

  const playArpeggio = (ctx: AudioContext, gain: GainNode) => {
    const notes = [220, 261.63, 329.63, 440]; // A3, C4, E4, A4
    let noteIndex = 0;
    
    const playNote = () => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(notes[noteIndex], ctx.currentTime);
      
      const vca = ctx.createGain();
      vca.gain.setValueAtTime(0, ctx.currentTime);
      vca.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      vca.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      
      osc.connect(vca);
      vca.connect(gain);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      
      noteIndex = (noteIndex + 1) % notes.length;
    };
    
    playIntervalRef.current = setInterval(playNote, 250);
  };

  const playRandom = (ctx: AudioContext, gain: GainNode) => {
    const playNote = () => {
      const osc = ctx.createOscillator();
      osc.type = Math.random() > 0.5 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(100 + Math.random() * 800, ctx.currentTime);
      
      const vca = ctx.createGain();
      vca.gain.setValueAtTime(0.3, ctx.currentTime);
      vca.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.connect(vca);
      vca.connect(gain);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    };
    
    playIntervalRef.current = setInterval(() => {
      if (Math.random() > 0.3) playNote();
    }, 150);
  };

  const startAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    
    if (ctx.state === 'suspended') ctx.resume();

    if (!gainNodeRef.current) {
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.connect(ctx.destination);
    }
    
    gainNodeRef.current.gain.value = muted ? 0 : 0.15;
    stopAudio();

    const track = TRACKS[currentTrackIndex];
    if (track.type === 'drone') playDrone(ctx, gainNodeRef.current!);
    if (track.type === 'arpeggio') playArpeggio(ctx, gainNodeRef.current!);
    if (track.type === 'random') playRandom(ctx, gainNodeRef.current!);
  };

  useEffect(() => {
    if (isPlaying) {
      startAudio();
    } else {
      stopAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
         audioCtxRef.current.suspend();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = muted ? 0 : 0.15;
    }
  }, [muted]);

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const skipTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    if (!isPlaying) setIsPlaying(true);
  };
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    if (!isPlaying) setIsPlaying(true);
  };
  const toggleMute = () => setMuted(!muted);

  return (
    <div className="flex flex-col h-full w-full justify-between">
      <div className="w-full">
        <h2 className="text-[11px] uppercase tracking-[3px] text-white/40 mb-3">Now Spinning</h2>
        <ul className="list-none w-full">
          {TRACKS.map((track, idx) => (
            <li 
              key={track.id} 
              className={`p-3 rounded border mb-2 cursor-pointer transition-all duration-200 ${currentTrackIndex === idx ? 'border-neon-blue bg-neon-blue/5' : 'border-transparent'}`}
              onClick={() => setCurrentTrackIndex(idx)}
            >
              <div className="font-semibold text-sm mb-1">{track.title}</div>
              <div className="font-mono text-[11px] text-neon-blue">{track.meta}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 pt-8 border-t border-white/10 w-full">
        <div className="text-[11px] uppercase tracking-[1px] opacity-60 mb-4">
          Playing: {TRACKS[currentTrackIndex].title}
        </div>
        
        <div className="flex items-center justify-between gap-6">
          <button onClick={prevTrack} className="bg-transparent border border-white/30 text-white px-5 py-2.5 rounded-full text-xs uppercase font-semibold cursor-pointer hover:bg-white/10">PREV</button>
          
          <button onClick={togglePlay} className="bg-white text-black border-none w-[50px] h-[50px] rounded-full flex items-center justify-center text-xl cursor-pointer hover:shadow-[0_0_15px_#fff]">
            {isPlaying ? <Square size={20} fill="black" /> : '▶'}
          </button>
          
          <button onClick={skipTrack} className="bg-transparent border border-white/30 text-white px-5 py-2.5 rounded-full text-xs uppercase font-semibold cursor-pointer hover:bg-white/10">NEXT</button>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button onClick={toggleMute} className="text-white opacity-50 hover:opacity-100 transition-opacity">
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div className="font-mono text-[11px] text-neon-blue ml-auto">00:00 / {TRACKS[currentTrackIndex].meta.split(' // ')[1]}</div>
        </div>
      </div>
    </div>
  );
}
