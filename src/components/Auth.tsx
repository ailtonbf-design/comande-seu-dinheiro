import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        alert('Cadastro realizado! Se o Supabase exigir confirmação, verifique seu e-mail. Caso contrário, você já pode entrar.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-6 text-white font-sans selection:bg-yellow-500/30">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4 flex flex-col items-center">
          <img 
            src="https://williampaganelli.com.br/comande-seu-dinheiro/wp-content/uploads/2024/08/Group-3-2.webp" 
            alt="Comande Seu Dinheiro Logo" 
            className="w-48 h-auto mx-auto"
            referrerPolicy="no-referrer"
          />
          <p className="text-zinc-400">Assuma o controle do seu futuro financeiro.</p>
        </div>

        <form onSubmit={handleAuth} className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1">Nome Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLogin}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                placeholder="Seu nome"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-4 rounded-xl transition-colors mt-4 flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-sm text-zinc-400 hover:text-yellow-500 transition-colors"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </div>
      </div>
    </div>
  );
}
