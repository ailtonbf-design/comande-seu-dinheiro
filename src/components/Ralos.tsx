import { useState, useEffect } from 'react';
import { AlertTriangle, Search, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Ralo {
  id: string;
  nome: string;
  valor: number;
}

export default function Ralos() {
  // State
  const [receitaMensal, setReceitaMensal] = useState<number>(12000); // Fallback base
  const [ralos, setRalos] = useState<Ralo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Buscar Receita Mensal
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('receita_mensal')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData && profileData.receita_mensal) {
        setReceitaMensal(profileData.receita_mensal);
      }

      // 2. Buscar Ralos Invisíveis
      const { data: ralosData, error: ralosError } = await supabase
        .from('ralos_invisiveis')
        .select('*')
        .eq('user_id', user.id);

      if (ralosError) throw ralosError;

      if (ralosData) {
        const formattedRalos: Ralo[] = ralosData.map((item: any) => ({
          id: item.id.toString(),
          nome: item.categoria,
          valor: Number(item.valor_mensal),
        }));
        // Inverte para mostrar os mais recentes primeiro
        setRalos(formattedRalos.reverse());
      }
    } catch (error) {
      console.error('Erro ao buscar dados do Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleAddRalo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !valor) return;

    // Converte string para número, trocando vírgula por ponto
    const numericValue = parseFloat(valor.replace(',', '.'));
    
    if (isNaN(numericValue) || numericValue <= 0) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('ralos_invisiveis')
        .insert([
          { 
            categoria: nome.trim(), 
            valor_mensal: numericValue,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newRalo: Ralo = {
          id: data.id.toString(),
          nome: data.categoria,
          valor: Number(data.valor_mensal),
        };
        setRalos([newRalo, ...ralos]);
        setNome('');
        setValor('');
      }
    } catch (error) {
      console.error('Erro ao adicionar ralo:', error);
      alert('Erro ao salvar o ralo. Verifique o console para mais detalhes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRalo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ralos_invisiveis')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRalos(ralos.filter(r => r.id !== id));
    } catch (error) {
      console.error('Erro ao remover ralo:', error);
      alert('Erro ao remover o ralo.');
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pt-6 pb-24 px-6 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-yellow-500" />
          <h1 className="text-xl font-bold text-yellow-500 uppercase tracking-wider">Ralos Invisíveis</h1>
        </div>
        <p className="text-sm text-zinc-400">Descubra para onde seu dinheiro está escorrendo.</p>
      </header>

      {/* Form */}
      <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6">
        <form onSubmit={handleAddRalo} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="nome" className="text-xs font-medium text-zinc-400 ml-1">Onde você gastou?</label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Delivery, Assinaturas"
              disabled={isSubmitting}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all disabled:opacity-50"
            />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="valor" className="text-xs font-medium text-zinc-400 ml-1">Qual o valor mensal?</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
              <input
                id="valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                disabled={isSubmitting}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!nome.trim() || !valor || isSubmitting}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-4 rounded-xl transition-colors mt-2 flex items-center justify-center"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            ) : (
              'Analisar Impacto'
            )}
          </button>
        </form>
      </section>

      {/* Results List */}
      <section className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        ) : ralos.length > 0 ? (
          ralos.map((ralo) => {
            const percentual = (ralo.valor / receitaMensal) * 100;
            const isHighImpact = percentual > 5;

            return (
              <div 
                key={ralo.id} 
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 relative overflow-hidden group"
              >
                {isHighImpact && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{ralo.nome}</h3>
                    <p className="text-zinc-400 text-sm">{formatCurrency(ralo.valor)} / mês</p>
                  </div>
                  <button 
                    onClick={() => handleRemoveRalo(ralo.id)}
                    className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-end space-x-2">
                  <span className="text-xs text-zinc-500 mb-1">Impacto na Renda:</span>
                  <span className={`text-2xl font-bold ${isHighImpact ? 'text-red-500' : 'text-emerald-400'}`}>
                    {percentual.toFixed(1)}%
                  </span>
                </div>

                {isHighImpact && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-xs leading-relaxed">
                      <strong className="font-bold uppercase tracking-wider">Atenção:</strong> Isso consome {percentual.toFixed(1)}% do seu esforço no mês!
                    </p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-3xl">
            <Search className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Nenhum ralo adicionado ainda.<br/>Comece a mapear seus gastos acima.</p>
          </div>
        )}
      </section>
    </div>
  );
}
