import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Loader2, Settings, Plus, Minus, Target, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../utils/cn';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const [userName, setUserName] = useState('Usuário');
  const [perfilFinanceiro, setPerfilFinanceiro] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Transactions state
  const [transacoes, setTransacoes] = useState<any[]>([]);
  
  // Modal state
  const [modalType, setModalType] = useState<'receita' | 'despesa' | null>(null);
  const [formData, setFormData] = useState({ nome: '', valor: '', isRalo: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.full_name?.split(' ')[0] || 'Usuário');

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('perfil_financeiro')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setPerfilFinanceiro(profileData.perfil_financeiro);
      }

      // Fetch Transactions
      const { data: transacoesData, error: transacoesError } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id);

      if (transacoesError) {
        // If table doesn't exist yet, it will fail silently here and return empty array
        console.error('Erro ao buscar transações:', transacoesError);
      } else {
        setTransacoes(transacoesData || []);
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const valorNum = parseFloat(formData.valor.replace(',', '.'));

      const { error } = await supabase.from('transacoes').insert({
        user_id: user.id,
        nome: formData.nome,
        descricao: formData.nome, // Added to satisfy existing not-null constraint
        valor: valorNum,
        tipo: modalType,
        is_ralo: modalType === 'despesa' ? formData.isRalo : false
      });

      if (error) throw error;

      setModalType(null);
      setFormData({ nome: '', valor: '', isRalo: false });
      fetchDashboardData();
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error);
      alert(`Erro ao salvar: ${error.message || 'Verifique o console para mais detalhes.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const receitaTotal = transacoes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + Number(t.valor), 0);
  const despesasFixas = transacoes.filter(t => t.tipo === 'despesa' && !t.is_ralo).reduce((acc, t) => acc + Number(t.valor), 0);
  const ralos = transacoes.filter(t => t.tipo === 'despesa' && t.is_ralo).reduce((acc, t) => acc + Number(t.valor), 0);
  const lucro = receitaTotal - despesasFixas - ralos;
  
  const chartData = [
    { name: 'Lucro Real', value: lucro > 0 ? lucro : 0, color: '#10b981' }, // emerald-500
    { name: 'Despesas Fixas', value: despesasFixas, color: '#71717a' }, // zinc-500
    { name: 'Ralos Invisíveis', value: ralos, color: '#ef4444' }, // red-500
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getWelcomePhrase = () => {
    if (!perfilFinanceiro) return 'Vamos construir o seu caminho para se tornar um Comandante do Dinheiro.';
    if (perfilFinanceiro.includes('Sobrevivência')) return 'Juntos, vamos construir o seu caminho para se tornar um Comandante do Dinheiro e sair do Modo Sobrevivência.';
    if (perfilFinanceiro.includes('Risco')) return 'Você está no caminho certo. Vamos focar em eliminar os ralos e chegar ao nível de Comandante do Dinheiro.';
    return 'Excelente trabalho! Continue mantendo o controle e multiplicando seu patrimônio.';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pt-6 pb-24 px-6 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <img 
            src="https://williampaganelli.com.br/comande-seu-dinheiro/wp-content/uploads/2024/08/Group-3-2.webp" 
            alt="Comande Seu Dinheiro Logo" 
            className="h-6 w-auto"
            referrerPolicy="no-referrer"
          />
          <div>
            <h2 className="text-2xl font-semibold text-white">Olá, {userName}</h2>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full border-2 border-zinc-800 bg-zinc-900 flex items-center justify-center text-yellow-500 font-bold uppercase shrink-0">
          {userName.charAt(0)}
        </div>
      </header>

      {/* Profile Badge & Welcome Phrase */}
      <div className="flex flex-col items-center text-center space-y-4">
        {perfilFinanceiro && (
          <div className={cn(
            "inline-flex items-center px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg",
            perfilFinanceiro.includes('Sobrevivência') ? "bg-red-500/10 text-red-500 border border-red-500/30 shadow-red-500/10" :
            perfilFinanceiro.includes('Risco') ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-yellow-500/10" :
            "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-emerald-500/10"
          )}>
            {perfilFinanceiro}
          </div>
        )}
        <p className="text-sm text-zinc-400 leading-relaxed px-4">
          {getWelcomePhrase()}
        </p>
      </div>

      {/* Quick Actions Hub */}
      <div className="grid grid-cols-3 gap-3">
        <button 
          onClick={() => setModalType('receita')}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 text-center">Nova Receita</span>
        </button>
        
        <button 
          onClick={() => setModalType('despesa')}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-red-500/50 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Minus className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 text-center">Nova Despesa</span>
        </button>

        <button 
          onClick={() => setActiveTab('sonhos')}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 text-center">Novo Sonho</span>
        </button>
      </div>

      {receitaTotal === 0 ? (
        /* Zero Income Alert Banner */
        <button 
          onClick={() => setModalType('receita')}
          className="w-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:bg-yellow-500/30 transition-all group"
        >
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-yellow-500 font-bold text-lg mb-2">Raio-X Bloqueado</h3>
            <p className="text-zinc-300 text-sm">Adicione sua primeira receita para desbloquear seu Raio-X Financeiro.</p>
          </div>
          <span className="inline-block mt-2 text-xs font-bold uppercase tracking-wider text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-full">
            Adicionar Receita
          </span>
        </button>
      ) : (
        <>
          {/* Main Chart Section */}
          <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/0 via-yellow-500/50 to-yellow-500/0"></div>
            <h3 className="text-zinc-400 text-sm font-medium mb-6">Fluxo de Caixa Real</h3>
            
            <div className="w-full h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Receita Total</span>
                <span className="text-lg font-bold text-white">{formatCurrency(receitaTotal)}</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 mt-6">
              <div className="bg-zinc-950 rounded-xl p-2 border border-zinc-800/50 text-center">
                 <div className="flex items-center justify-center space-x-1.5 mb-1">
                   <div className="w-2 h-2 rounded-full bg-zinc-500"></div>
                   <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Fixas</span>
                 </div>
                 <p className="text-xs font-semibold text-white">{formatCurrency(despesasFixas)}</p>
              </div>
              <div className="bg-zinc-950 rounded-xl p-2 border border-zinc-800/50 text-center">
                 <div className="flex items-center justify-center space-x-1.5 mb-1">
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Ralos</span>
                 </div>
                 <p className="text-xs font-semibold text-red-400">{formatCurrency(ralos)}</p>
              </div>
              <div className="bg-zinc-950 rounded-xl p-2 border border-zinc-800/50 text-center">
                 <div className="flex items-center justify-center space-x-1.5 mb-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Lucro</span>
                 </div>
                 <p className="text-xs font-semibold text-emerald-400">{formatCurrency(lucro)}</p>
              </div>
            </div>
          </section>

          {/* Ralos Alert */}
          {ralos > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-500 font-bold text-sm uppercase tracking-wider">Atenção aos Ralos!</h3>
                <p className="text-red-400/80 text-xs mt-1">
                  <strong className="text-red-400">{formatCurrency(ralos)}</strong> da sua renda foram para ralos invisíveis este mês.
                </p>
              </div>
            </div>
          )}

          {/* Projected Profit */}
          <section className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/20 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-yellow-500/80 text-xs font-bold uppercase tracking-wider mb-1">Seu Lucro Real</h3>
              <p className="text-2xl font-bold text-yellow-500">{formatCurrency(lucro)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-500" />
            </div>
          </section>
        </>
      )}

      {/* Transaction Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 space-y-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div>
              <h3 className="text-xl font-bold text-white">
                {modalType === 'receita' ? 'Nova Receita' : 'Nova Despesa'}
              </h3>
              <p className="text-zinc-400 text-sm mt-1">
                {modalType === 'receita' ? 'Adicione um novo ganho ao seu caixa.' : 'Registre um novo gasto.'}
              </p>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 ml-1">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                  placeholder={modalType === 'receita' ? "Ex: Salário, Freelance..." : "Ex: Conta de Luz, Ifood..."}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 ml-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                  placeholder="0.00"
                />
              </div>

              {modalType === 'despesa' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-red-500 font-bold text-sm">⚠️ É um Ralo Invisível?</h4>
                    <p className="text-red-400/80 text-xs mt-0.5">Gasto supérfluo ou besteira</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.isRalo}
                      onChange={(e) => setFormData({...formData, isRalo: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full font-bold py-4 rounded-xl transition-colors mt-2 flex items-center justify-center",
                  modalType === 'receita' 
                    ? "bg-emerald-500 hover:bg-emerald-400 text-black" 
                    : "bg-red-500 hover:bg-red-400 text-white",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Lançamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
