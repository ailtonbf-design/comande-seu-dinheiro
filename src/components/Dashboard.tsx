import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Loader2, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../utils/cn';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const [userName, setUserName] = useState('Usuário');
  const [receitaTotal, setReceitaTotal] = useState(0);
  const [totalRalos, setTotalRalos] = useState(0);
  const [perfilFinanceiro, setPerfilFinanceiro] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.full_name?.split(' ')[0] || 'Usuário');

      // 1. Receita Mensal e Perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('receita_mensal, perfil_financeiro')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
      }

      if (profileData) {
        setReceitaTotal(Number(profileData.receita_mensal) || 0);
        setPerfilFinanceiro(profileData.perfil_financeiro);
      }

      // 2. Ralos Invisíveis
      const { data: ralosData } = await supabase
        .from('ralos_invisiveis')
        .select('valor_mensal')
        .eq('user_id', user.id);

      const somaRalos = ralosData?.reduce((acc, curr) => acc + Number(curr.valor_mensal), 0) || 0;
      setTotalRalos(somaRalos);

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cálculos Matemáticos
  const totalDespesas = totalRalos; 
  const lucro = receitaTotal - totalDespesas;
  
  const chartData = [
    { name: 'Lucro', value: lucro > 0 ? lucro : 0, color: '#10b981' }, // emerald-500
    { name: 'Despesas', value: totalDespesas, color: '#ef4444' }, // red-500
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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

      {/* Profile Badge (Highlighted) */}
      {perfilFinanceiro && (
        <div className="flex justify-center">
          <div className={cn(
            "inline-flex items-center px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg",
            perfilFinanceiro.includes('Sobrevivência') ? "bg-red-500/10 text-red-500 border border-red-500/30 shadow-red-500/10" :
            perfilFinanceiro.includes('Risco') ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-yellow-500/10" :
            "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-emerald-500/10"
          )}>
            {perfilFinanceiro}
          </div>
        </div>
      )}

      {receitaTotal === 0 ? (
        /* Zero Income Alert Banner */
        <button 
          onClick={() => setActiveTab('config')}
          className="w-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:bg-yellow-500/30 transition-all group"
        >
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Settings className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-yellow-500 font-bold text-lg mb-2">Raio-X Bloqueado</h3>
            <p className="text-zinc-300 text-sm">Defina sua Renda Mensal para desbloquear seu Raio-X Financeiro.</p>
          </div>
          <span className="inline-block mt-2 text-xs font-bold uppercase tracking-wider text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-full">
            Configurar Agora
          </span>
        </button>
      ) : (
        <>
          {/* Main Chart Section */}
          <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/0 via-yellow-500/50 to-yellow-500/0"></div>
            <h3 className="text-zinc-400 text-sm font-medium mb-6">Raio-X Mensal</h3>
            
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
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Receita</span>
                <span className="text-lg font-bold text-white">{formatCurrency(receitaTotal)}</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mt-6">
              <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800/50">
                 <div className="flex items-center space-x-2 mb-1">
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   <span className="text-xs text-zinc-400">Despesas</span>
                 </div>
                 <p className="text-sm font-semibold text-white">{formatCurrency(totalDespesas)}</p>
              </div>
              <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800/50">
                 <div className="flex items-center space-x-2 mb-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <span className="text-xs text-zinc-400">Lucro</span>
                 </div>
                 <p className="text-sm font-semibold text-emerald-400">{formatCurrency(lucro)}</p>
              </div>
            </div>
          </section>

          {/* Projected Profit */}
          <section className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/20 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-yellow-500/80 text-xs font-bold uppercase tracking-wider mb-1">Seu Lucro Mensal Projetado</h3>
              <p className="text-2xl font-bold text-yellow-500">{formatCurrency(lucro)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-500" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
