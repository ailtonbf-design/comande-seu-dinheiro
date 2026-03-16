import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Settings, Loader2, CheckCircle2 } from 'lucide-react';

export default function Config() {
  const [renda, setRenda] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
        .select('receita_mensal')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data && data.receita_mensal) {
        setRenda(data.receita_mensal.toString().replace('.', ','));
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renda) return;

    const numericValue = parseFloat(renda.replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) return;

    setIsSaving(true);
    setSuccessMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('profiles')
        .update({ receita_mensal: numericValue })
        .eq('id', user.id);

      if (error) throw error;

      setSuccessMsg('Renda atualizada com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar renda:', error);
      alert('Erro ao salvar os dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pt-6 pb-24 px-6 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-yellow-500" />
          <h1 className="text-xl font-bold text-yellow-500 uppercase tracking-wider">Configurações</h1>
        </div>
        <p className="text-sm text-zinc-400">Gerencie sua conta e preferências.</p>
      </header>

      <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-yellow-500">Seu Perfil Financeiro</h2>
          <p className="text-xs text-zinc-400">Atualize sua renda para manter os cálculos precisos.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="renda" className="text-xs font-medium text-zinc-400 ml-1">Sua Renda Mensal (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
              <input
                id="renda"
                type="text"
                value={renda}
                onChange={(e) => setRenda(e.target.value)}
                placeholder="0,00"
                disabled={isLoading || isSaving}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-emerald-400 text-xs font-medium">{successMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!renda || isLoading || isSaving}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-4 rounded-xl transition-colors flex items-center justify-center"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            ) : (
              'Salvar Dados'
            )}
          </button>
        </form>
      </section>

      <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-red-400 font-medium py-4 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair da Conta</span>
        </button>
      </section>
    </div>
  );
}
