import { Home, Star, Settings } from 'lucide-react';
import { cn } from '../utils/cn';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Raio-X' },
    { id: 'sonhos', icon: Star, label: 'Sonhos' },
    { id: 'config', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-zinc-800/50 pb-safe">
      <div className="max-w-md mx-auto px-6 h-20 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center w-20 h-full space-y-1 relative"
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-yellow-500 rounded-b-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
              )}
              <Icon 
                className={cn(
                  "w-6 h-6 transition-colors duration-200",
                  isActive ? "text-yellow-500" : "text-zinc-500"
                )} 
              />
              <span 
                className={cn(
                  "text-[10px] font-medium transition-colors duration-200",
                  isActive ? "text-yellow-500" : "text-zinc-500"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
