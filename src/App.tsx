/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Dashboard from './components/Dashboard';
import BottomNav from './components/BottomNav';
import Ralos from './components/Ralos';
import Sonhos from './components/Sonhos';
import Auth from './components/Auth';
import Config from './components/Config';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="bg-black min-h-screen text-white font-sans pb-20 selection:bg-yellow-500/30">
      {activeTab === 'home' && <Dashboard />}
      {activeTab === 'ralos' && <Ralos />}
      {activeTab === 'sonhos' && <Sonhos />}
      {activeTab === 'config' && <Config />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
