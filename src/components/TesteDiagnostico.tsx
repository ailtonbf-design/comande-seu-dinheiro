import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

const questions = [
  {
    id: 1,
    text: 'Como você descreve sua relação com o dinheiro hoje?',
    options: [
      { text: 'Tenho total controle, invisto todo mês e sei exatamente para onde vai cada centavo.', points: 10 },
      { text: 'Consigo pagar as contas, mas sobra pouco ou nada no fim do mês.', points: 5 },
      { text: 'Estou sempre no vermelho, usando cheque especial ou cartão de crédito para sobreviver.', points: 0 },
    ],
  },
  {
    id: 2,
    text: 'Se você perdesse sua principal fonte de renda hoje, por quanto tempo conseguiria manter seu padrão de vida?',
    options: [
      { text: 'Mais de 6 meses (Tenho reserva de emergência sólida).', points: 10 },
      { text: 'De 1 a 3 meses (Tenho alguma economia, mas não o suficiente).', points: 5 },
      { text: 'Menos de 1 mês (Não tenho nenhuma reserva).', points: 0 },
    ],
  },
  {
    id: 3,
    text: 'Com que frequência você planeja seus gastos antes do mês começar?',
    options: [
      { text: 'Sempre. Faço um orçamento detalhado e sigo à risca.', points: 10 },
      { text: 'Às vezes. Tenho uma ideia de quanto vou gastar, mas não anoto tudo.', points: 5 },
      { text: 'Nunca. Gasto conforme o dinheiro entra e torço para dar certo.', points: 0 },
    ],
  },
  {
    id: 4,
    text: 'O que você faz quando vê uma promoção imperdível de algo que não estava precisando?',
    options: [
      { text: 'Ignoro. Só compro o que está no meu planejamento.', points: 10 },
      { text: 'Penso bem, às vezes acabo comprando se achar que vale muito a pena.', points: 5 },
      { text: 'Compro na hora. Não posso perder uma boa oportunidade.', points: 0 },
    ],
  },
  {
    id: 5,
    text: 'Qual é o seu principal objetivo financeiro no momento?',
    options: [
      { text: 'Multiplicar meu patrimônio e alcançar a liberdade financeira.', points: 10 },
      { text: 'Juntar dinheiro para um objetivo específico (viagem, carro, casa).', points: 5 },
      { text: 'Sair das dívidas e parar de pagar juros.', points: 0 },
    ],
  },
];

interface TesteDiagnosticoProps {
  onComplete: () => void;
}

export default function TesteDiagnostico({ onComplete }: TesteDiagnosticoProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [profileName, setProfileName] = useState('');

  const handleAnswer = (points: number) => {
    const newAnswers = [...answers, points];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishTest(newAnswers);
    }
  };

  const finishTest = async (finalAnswers: number[]) => {
    setIsSubmitting(true);
    const totalScore = finalAnswers.reduce((acc, curr) => acc + curr, 0);
    setScore(totalScore);

    let profile = '';
    if (totalScore <= 20) {
      profile = '🚨 Modo Sobrevivência';
    } else if (totalScore <= 35) {
      profile = '⚠️ Zona de Risco';
    } else {
      profile = '🏆 Comandante do Dinheiro';
    }
    setProfileName(profile);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('profiles')
        .update({ 
          pontuacao_teste: totalScore,
          perfil_financeiro: profile
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setIsFinished(true);
    } catch (error) {
      console.error('Erro ao salvar diagnóstico:', error);
      alert('Ocorreu um erro ao salvar seu resultado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-4" />
        <p className="text-zinc-400 animate-pulse">Analisando seu perfil financeiro...</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-yellow-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Seu Diagnóstico Está Pronto!</h2>
            <p className="text-zinc-400 text-sm">Com base nas suas respostas, seu perfil atual é:</p>
          </div>

          <div className={`py-4 px-6 rounded-2xl border ${
            score <= 20 ? 'bg-red-500/10 border-red-500/20 text-red-500' :
            score <= 35 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
            'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
          }`}>
            <span className="text-2xl font-bold tracking-wide">{profileName}</span>
          </div>

          <p className="text-sm text-zinc-500">
            Sua pontuação: <strong className="text-white">{score} / 50</strong>
          </p>

          <button
            onClick={onComplete}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 rounded-xl transition-colors mt-8 flex items-center justify-center space-x-2"
          >
            <span>Acessar Meu Painel</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-black flex flex-col p-6 text-white selection:bg-yellow-500/30">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center space-y-8">
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <span>Diagnóstico Financeiro</span>
            <span>{currentQuestion + 1} de {questions.length}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold leading-snug text-white">
            {question.text}
          </h2>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.points)}
                className="w-full text-left bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800/50 hover:border-yellow-500/30 rounded-2xl p-5 transition-all group"
              >
                <p className="text-zinc-300 group-hover:text-white text-sm leading-relaxed">
                  {option.text}
                </p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
