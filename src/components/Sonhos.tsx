import { useState, useEffect } from 'react';
import { Star, Target, Trash2, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Sonho {
  id: string;
  nome: string;
  valorTotal: number;
  economiaDiaria: number;
}

export default function Sonhos() {
  // State
  const [lucroMensal, setLucroMensal] = useState<number>(2900); // Fallback base
  const [sonhos, setSonhos] = useState<Sonho[]>([]);
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

      // 1. Buscar Receita Mensal para calcular o lucro base
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('receita_mensal')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
      }

      if (profileData && profileData.receita_mensal) {
        // Assume 20% of income as default savings capacity for the simulation
        setLucroMensal(profileData.receita_mensal * 0.2);
      }

      // 2. Buscar Sonhos
      const { data: sonhosData, error: sonhosError } = await supabase
        .from('sonhos_metas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sonhosError) throw sonhosError;

      if (sonhosData) {
        const formattedSonhos: Sonho[] = sonhosData.map((item: any) => ({
          id: item.id.toString(),
          nome: item.nome_sonho,
          valorTotal: Number(item.valor_alvo),
          economiaDiaria: 0, // Slider starts at 0
        }));
        setSonhos(formattedSonhos);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleAddSonho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !valor) return;

    // Convert string to number, replacing comma with dot if necessary
    const numericValue = parseFloat(valor.replace(',', '.'));
    
    if (isNaN(numericValue) || numericValue <= 0) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('sonhos_metas')
        .insert([
          { 
            nome_sonho: nome.trim(), 
            valor_alvo: numericValue,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newSonho: Sonho = {
          id: data.id.toString(),
          nome: data.nome_sonho,
          valorTotal: Number(data.valor_alvo),
          economiaDiaria: 0,
        };
        setSonhos([newSonho, ...sonhos]);
        setNome('');
        setValor('');
      }
    } catch (error) {
      console.error('Erro ao adicionar sonho:', error);
      alert('Erro ao salvar o sonho.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSonho = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sonhos_metas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSonhos(sonhos.filter(s => s.id !== id));
    } catch (error) {
      console.error('Erro ao remover sonho:', error);
      alert('Erro ao remover o sonho.');
    }
  };

  const handleSliderChange = (id: string, value: number) => {
    setSonhos(sonhos.map(s => s.id === id ? { ...s, economiaDiaria: value } : s));
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pt-6 pb-24 px-6 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h1 className="text-xl font-bold text-yellow-500 uppercase tracking-wider">Seus Sonhos</h1>
        </div>
        <p className="text-sm text-zinc-400">O poder da economia diária na prática.</p>
      </header>

      {/* Form */}
      <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6">
        <form onSubmit={handleAddSonho} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="nome" className="text-xs font-medium text-zinc-400 ml-1">Qual é o seu próximo grande sonho?</label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Viagem, Carro"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
            />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="valor" className="text-xs font-medium text-zinc-400 ml-1">Qual o valor total necessário?</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
              <input
                id="valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
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
              'Simular Conquista'
            )}
          </button>
        </form>
      </section>

      {/* Results List */}
      <section className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        ) : sonhos.length > 0 ? (
          sonhos.map((sonho) => {
            const tempoBase = lucroMensal > 0 ? Math.ceil(sonho.valorTotal / lucroMensal) : Infinity;
            const novoLucro = lucroMensal + (sonho.economiaDiaria * 30);
            const novoTempo = novoLucro > 0 ? Math.ceil(sonho.valorTotal / novoLucro) : Infinity;
            const mesesAntecipados = tempoBase !== Infinity && novoTempo !== Infinity ? tempoBase - novoTempo : 0;

            return (
              <div 
                key={sonho.id} 
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6 relative overflow-hidden"
              >
                {/* Dream Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{sonho.nome}</h3>
                      <p className="text-zinc-400 text-sm">{formatCurrency(sonho.valorTotal)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveSonho(sonho.id)}
                    className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar (Starts at 0%) */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-yellow-500 font-medium">0% Concluído</span>
                    <span className="text-zinc-500">R$ 0,00 guardados</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-950 border border-zinc-800/50 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full w-0"></div>
                  </div>
                  <p className="text-sm text-zinc-400 pt-2">
                    Com sua capacidade de poupança atual, você conquista isso em <strong className="text-white">{tempoBase} meses</strong>.
                  </p>
                </div>

                {/* The Magic: Rule of R$ 3 Slider */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-400">
                      E se você cortar gastos diários? <br/>
                      <span className="text-yellow-500/80">(A Regra dos R$ 3)</span>
                    </label>
                    <span className="text-lg font-bold text-white">
                      {formatCurrency(sonho.economiaDiaria)}<span className="text-xs text-zinc-500 font-normal">/dia</span>
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={sonho.economiaDiaria}
                    onChange={(e) => handleSliderChange(sonho.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  
                  <div className="flex justify-between text-[10px] text-zinc-500 px-1">
                    <span>R$ 0</span>
                    <span>R$ 15</span>
                    <span>R$ 30</span>
                  </div>

                  {/* Dynamic Impact Text */}
                  {sonho.economiaDiaria > 0 && mesesAntecipados > 0 && (
                    <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start space-x-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-emerald-400 text-sm leading-relaxed">
                        Economizando mais <strong className="font-bold">{formatCurrency(sonho.economiaDiaria)}/dia</strong>, você antecipa seu sonho em <strong className="font-bold text-emerald-300">{mesesAntecipados} meses</strong>!
                      </p>
                    </div>
                  )}
                  {sonho.economiaDiaria > 0 && mesesAntecipados === 0 && (
                    <div className="mt-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-3 flex items-start space-x-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <TrendingUp className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        Economizando mais <strong className="font-bold">{formatCurrency(sonho.economiaDiaria)}/dia</strong>, você acelera a conquista, mas ainda leva <strong className="font-bold text-zinc-300">{novoTempo} meses</strong>.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-3xl">
            <Star className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Nenhum sonho adicionado ainda.<br/>O que você quer conquistar?</p>
          </div>
        )}
      </section>
    </div>
  );
}
