import React from 'react';
import { Card, Button, Badge } from '../../components/ui/Base';
import { useSetRecoilState } from 'recoil';
import { navigationState } from '../../store/atoms';
import { 
  Settings, 
  MapPin, 
  Link as LinkIcon, 
  Twitter, 
  Github, 
  Flame, 
  CheckCircle2, 
  Coins, 
  CalendarDays,
  Edit2
} from 'lucide-react';

export const Profile = () => {
  const setPage = useSetRecoilState(navigationState);

  // Mock Data
  const user = {
    name: '지훈 성',
    username: 'felix_dev',
    bio: 'Frontend Developer | Algorithm Enthusiast',
    level: 15,
    xp: 2450,
    nextLevelXp: 3000,
    location: 'Seoul, Korea',
    website: 'https://felix.dev',
    stats: {
      streak: 42,
      solved: 315,
      points: 12500
    }
  };

  // Activity Graph Mock
  const activity = Array.from({ length: 12 }).map((_, i) => ({
    month: i + 1,
    count: Math.floor(Math.random() * 50) + 10
  }));

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1117] p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Header */}
        <Card className="p-8 bg-[#141820] border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-emerald-900/40 to-slate-900/40"></div>
          
          <div className="relative flex flex-col md:flex-row gap-6 items-end -mt-4">
            <div className="w-32 h-32 rounded-2xl bg-slate-800 border-4 border-[#141820] overflow-hidden shadow-xl">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-slate-100">{user.name}</h1>
                  <p className="text-slate-400 font-medium">@{user.username}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="gap-2">
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </Button>
                  <Button variant="secondary" onClick={() => setPage('settings')}>
                    <Settings className="w-4 h-4" /> Settings
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {user.location}
                </div>
                <div className="flex items-center gap-1 hover:text-emerald-500 cursor-pointer">
                  <LinkIcon className="w-4 h-4" /> {user.website}
                </div>
                <div className="flex gap-3 ml-2">
                  <Github className="w-4 h-4 hover:text-white cursor-pointer" />
                  <Twitter className="w-4 h-4 hover:text-blue-400 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-slate-300">Level {user.level}</span>
              <span className="text-sm text-slate-500">{user.xp} / {user.nextLevelXp} XP</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${(user.xp / user.nextLevelXp) * 100}%` }}
              ></div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-[#141820] border-slate-800 flex items-center gap-4">
            <div className="p-3 rounded-full bg-orange-500/10 text-orange-500">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{user.stats.streak} Days</div>
              <div className="text-xs text-slate-500">Current Streak</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-[#141820] border-slate-800 flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{user.stats.solved}</div>
              <div className="text-xs text-slate-500">Problems Solved</div>
            </div>
          </Card>

          <Card className="p-6 bg-[#141820] border-slate-800 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-500">
              <Coins className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{user.stats.points.toLocaleString()}</div>
              <div className="text-xs text-slate-500">Reward Points</div>
            </div>
          </Card>
        </div>

        {/* Contribution Activity (Grass Graph Placeholder) */}
        <Card className="p-6 bg-[#141820] border-slate-800">
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-slate-500" /> Solving Activity
          </h3>
          {/* Simple visualization of monthly activity */}
          <div className="flex items-end justify-between h-32 gap-2">
            {activity.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-emerald-500/20 rounded-t-sm hover:bg-emerald-500/50 transition-colors relative"
                  style={{ height: `${(item.count / 60) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {item.count} solved
                  </div>
                </div>
                <span className="text-xs text-slate-600 font-mono">{item.month}월</span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
};
