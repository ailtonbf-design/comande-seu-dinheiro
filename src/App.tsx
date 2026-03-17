/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Dashboard from './components/Dashboard';
import BottomNav from './components/BottomNav';
import Sonhos from './components/Sonhos';
import Auth from './components/Auth';
import Config from './components/Config';
import TesteDiagnostico from './components/TesteDiagnostico';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedTest, setHasCompletedTest] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkTestCompletion(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkTestCompletion(session.user.id);
      } else {
        setHasCompletedTest(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkTestCompletion = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('pontuacao_teste')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      setHasCompletedTest(data?.pontuacao_teste !== null && data?.pontuacao_teste !== undefined);
    } catch (error) {
      console.error('Erro ao verificar teste:', error);
      setHasCompletedTest(false);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (hasCompletedTest === false) {
    return <TesteDiagnostico onComplete={() => setHasCompletedTest(true)} />;
  }

  return (
    <div className="bg-black min-h-screen text-white font-sans pb-20 selection:bg-yellow-500/30">
      {activeTab === 'home' && <Dashboard setActiveTab={setActiveTab} />}
      {activeTab === 'sonhos' && <Sonhos />}
      {activeTab === 'config' && <Config />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
