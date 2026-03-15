import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Monitor } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-6">
        <h1 className="text-5xl font-display font-black text-foreground mb-3 tracking-tight">
          <span className="text-accent">Millionaire</span> Live
        </h1>
        <p className="text-muted-foreground text-lg mb-12 font-body">
          Interactive quiz game system for live streaming
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            to="/admin"
            className="glass-panel p-8 hover:border-primary/50 transition-all duration-300 group hover:glow-blue"
          >
            <Gamepad2 className="mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" size={40} />
            <h2 className="font-display font-bold text-xl text-foreground mb-2">Admin Panel</h2>
            <p className="text-muted-foreground text-sm">Control the game during live streams</p>
          </Link>
          <Link
            to="/overlay/game"
            className="glass-panel p-8 hover:border-accent/50 transition-all duration-300 group hover:glow-gold"
          >
            <Monitor className="mx-auto mb-4 text-accent group-hover:scale-110 transition-transform" size={40} />
            <h2 className="font-display font-bold text-xl text-foreground mb-2">OBS Overlay</h2>
            <p className="text-muted-foreground text-sm">Browser source for OBS (1920×1080)</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
