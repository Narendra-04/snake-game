import MusicPlayer from './components/MusicPlayer';
import SnakeGame from './components/SnakeGame';

export default function App() {
  return (
    <div className="grid grid-cols-[320px_1fr] grid-rows-[140px_1fr] h-screen gap-[1px] bg-white/10">
      <header className="col-span-2 flex justify-between items-baseline bg-bg p-6 border border-white/5">
        <h1 className="text-[80px] leading-[0.8] font-black tracking-[-4px] uppercase text-neon-pink drop-shadow-[0_0_20px_var(--color-neon-pink)]">
          BEATSNAKE
        </h1>
      </header>

      <aside className="col-start-1 row-start-2 flex flex-col gap-5 bg-bg p-6 border border-white/5">
        <MusicPlayer />
      </aside>

      <main className="col-start-2 row-start-2 flex items-center justify-center relative bg-[radial-gradient(circle_at_center,#111_0%,#080808_100%)] bg-bg p-6 border border-white/5">
        <SnakeGame />
      </main>
    </div>
  );
}
