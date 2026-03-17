import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Trash2, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';

export default function Extrato() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransacoes();
  }, []);

  const fetchTransacoes = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransacoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar extrato:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic UI update
    const previousTransacoes = [...transacoes];
    setTransacoes(prev => prev.filter(t => t.id !== id));

    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      // Revert on error
      setTransacoes(previousTransacoes);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(date).replace(' de ', '/').replace('.', '');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pt-6 pb-24 px-6 space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Extrato</h2>
        <p className="text-sm text-zinc-400 mt-1">Seu histórico de movimentações</p>
      </header>

      <div className="space-y-3">
        {transacoes.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-zinc-500" />
            </div>
            <p className="text-zinc-500 text-sm">Nenhuma transação registrada ainda.</p>
          </div>
        ) : (
          transacoes.map((t) => (
            <div 
              key={t.id} 
              className="bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors rounded-2xl p-4 flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  t.tipo === 'receita' ? "bg-emerald-500/10" :
                  t.is_ralo ? "bg-red-500/10" : "bg-zinc-800"
                )}>
                  {t.tipo === 'receita' ? <ArrowUpRight className="w-5 h-5 text-emerald-500" /> :
                   t.is_ralo ? <AlertTriangle className="w-5 h-5 text-red-500" /> :
                   <ArrowDownRight className="w-5 h-5 text-zinc-400" />}
                </div>
                <div className="truncate pr-2">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-white truncate">{t.nome}</p>
                    {t.is_ralo && (
                      <span className="shrink-0 inline-flex items-center space-x-1 bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                        <span>🚨</span>
                        <span>Ralo</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{formatDate(t.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 shrink-0">
                <span className={cn(
                  "text-sm font-bold",
                  t.tipo === 'receita' ? "text-emerald-500" :
                  t.is_ralo ? "text-red-500" : "text-zinc-300"
                )}>
                  {t.tipo === 'receita' ? '+' : '-'} {formatCurrency(t.valor)}
                </span>
                <button 
                  onClick={() => handleDelete(t.id)}
                  className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Excluir transação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
