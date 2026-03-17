import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Settings, Loader2, User, Mail, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { cn } from '../utils/cn';

interface UserProfile {
  nome: string | null;
  email: string | null;
  perfil_financeiro: string | null;
}

export default function Config() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('nome, perfil_financeiro')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      setProfile({
        nome: data?.nome || user.user_metadata?.full_name || 'Usuário',
        email: user.email || '',
        perfil_financeiro: data?.perfil_financeiro || 'Não definido'
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getProfileBadge = (perfil: string) => {
    if (perfil.includes('Sobrevivência')) {
      return {
        icon: ShieldAlert,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        label: '🚨 Modo Sobrevivência'
      };
    }
    if (perfil.includes('Equilíbrio')) {
      return {
        icon: Shield,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        label: '⚖️ Modo Equilíbrio'
      };
    }
    if (perfil.includes('Liberdade')) {
      return {
        icon: ShieldCheck,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        label: '🦅 Modo Liberdade'
      };
    }
    return {
      icon: Shield,
      color: 'text-zinc-400',
      bg: 'bg-zinc-800/50',
      border: 'border-zinc-700/50',
      label: perfil
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  const badge = profile?.perfil_financeiro ? getProfileBadge(profile?.perfil_financeiro) : null;
  const BadgeIcon = badge?.icon || Shield;

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pt-6 pb-24 px-6 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-yellow-500" />
          <h1 className="text-xl font-bold text-yellow-500 uppercase tracking-wider">Minha Conta</h1>
        </div>
        <p className="text-sm text-zinc-400">Suas informações e perfil financeiro.</p>
      </header>

      <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-yellow-500/20 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-lg font-bold text-white truncate">{profile?.nome}</h2>
            <div className="flex items-center space-x-1.5 text-zinc-400 mt-1">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <p className="text-sm truncate">{profile?.email}</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800/50">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Status Atual</h3>
          {badge ? (
            <div className={cn("flex items-center space-x-3 p-4 rounded-2xl border", badge.bg, badge.border)}>
              <div className={cn("p-2 rounded-xl bg-black/20", badge.color)}>
                <BadgeIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Perfil Financeiro</p>
                <p className={cn("text-sm font-bold", badge.color)}>{badge.label}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-4 rounded-2xl border bg-zinc-800/50 border-zinc-700/50">
              <p className="text-sm text-zinc-400">Perfil não definido</p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-auto pt-8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 bg-zinc-900/50 hover:bg-red-500/10 border border-zinc-800/50 hover:border-red-500/20 text-red-500 font-medium py-4 rounded-2xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair da Conta</span>
        </button>
      </section>
    </div>
  );
}
