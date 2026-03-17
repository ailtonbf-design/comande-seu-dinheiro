import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ShieldAlert, TrendingUp, Target, Wallet, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../utils/cn';

// Mock Data for sections not yet integrated
const mockProvisionadas = [
  { id: '1', nome: 'IPVA', valorMensal: 200 },
  { id: '2', nome: 'IPTU', valorMensal: 150 },
  { id: '3', nome: 'Seguro Carro', valorMensal: 250 },
];

const mockSonho = {
  id: '1',
  nome: 'Viagem para Europa',
  valorTotal: 25000,
  valorGuardado: 5000,
};

export default function Dashboard() {
  const [userName, setUserName] = useState('Usuário');
  const [receitaTotal, setReceitaTotal] = useState(0);
  const [totalRalos, setTotalRalos] = useState(0);
  const [perfilFinanceiro, setPerfilFinanceiro] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [provisionadas] = useState(mockProvisionadas);
  const [sonho] = useState(mockSonho);

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
  const totalProvisionado = provisionadas.reduce((acc, curr) => acc + curr.valorMensal, 0);
  // Nota: futuramente somaremos as provisões aqui. Por enquanto, apenas ralos.
  const totalDespesas = totalRalos; 
  const lucro = receitaTotal - totalDespesas;
  
  // Gatilho do Modo Sobrevivência
  const isSurvivalMode = receitaTotal > 0 ? (lucro / receitaTotal) < 0.10 : true;
  
  const chartData = [
    { name: 'Lucro', value: lucro > 0 ? lucro : 0, color: '#10b981' }, // emerald-500
    { name: 'Despesas', value: totalDespesas, color: '#ef4444' }, // red-500
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const percentConcluido = (sonho.valorGuardado / sonho.valorTotal) * 100;
  const mesesRestantes = lucro > 0 ? Math.ceil((sonho.valorTotal - sonho.valorGuardado) / lucro) : '∞';

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
            {perfilFinanceiro && (
              <div className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1",
                perfilFinanceiro.includes('Sobrevivência') ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                perfilFinanceiro.includes('Risco') ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              )}>
                {perfilFinanceiro}
              </div>
            )}
          </div>
        </div>
        <div className="w-12 h-12 rounded-full border-2 border-zinc-800 bg-zinc-900 flex items-center justify-center text-yellow-500 font-bold uppercase shrink-0">
          {userName.charAt(0)}
        </div>
      </header>

      {/* Survival Mode Alert */}
      {isSurvivalMode ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start space-x-3">
          <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-500 font-bold text-sm uppercase tracking-wider">⚠️ Aviso: Modo Sobrevivência Ativado!</h3>
            <p className="text-red-400/80 text-xs mt-1">Sua margem de lucro está abaixo de 10% ou negativa. Reduza seus ralos invisíveis para sair da zona de risco.</p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start space-x-3">
          <TrendingUp className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-emerald-500 font-bold text-sm uppercase tracking-wider">✅ Você está no controle do seu dinheiro!</h3>
            <p className="text-emerald-400/80 text-xs mt-1">Sua margem de lucro está saudável. Continue assim para acelerar seus sonhos.</p>
          </div>
        </div>
      )}

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

      {/* Provisioned Savings */}
      <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 flex items-start justify-between opacity-50 grayscale">
        <div className="space-y-1">
          <h3 className="text-zinc-400 text-sm font-medium">Este mês, separe</h3>
          <p className="text-xl font-bold text-white">{formatCurrency(totalProvisionado)}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider pt-1">Para IPVA, IPTU, Seguros, etc. (Em breve)</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5 text-zinc-400" />
        </div>
      </section>

      {/* Dream Progress */}
      <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 opacity-50 grayscale">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-sm font-medium text-zinc-400">Próximo Sonho: <span className="text-white font-semibold">{sonho.nome}</span></h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400 font-medium">{percentConcluido.toFixed(1)}% Concluído</span>
            <span className="text-zinc-500">{formatCurrency(sonho.valorGuardado)} / {formatCurrency(sonho.valorTotal)}</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${percentConcluido}%` }}
            ></div>
          </div>
          <p className="text-xs text-zinc-500 text-right">
            Restam <strong className="text-zinc-300">{mesesRestantes} meses</strong> no ritmo atual
          </p>
        </div>
      </section>

    </div>
  );
}
