import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dumbbell, Lock, Mail, User, AlertCircle, UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

export function Cadastro() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email.trim(), password, nome.trim(), 'Atendente');
    if (signUpError) {
      setError(signUpError);
      setLoading(false);
    } else {
      navigate('/login');
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Left panel — branding with dumbbell pattern */}
      <div className="relative hidden w-1/2 overflow-hidden bg-blue-700 lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-[5%] top-[8%] rotate-12">
            <Dumbbell className="h-24 w-24 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute right-[10%] top-[20%] -rotate-12">
            <Dumbbell className="h-32 w-32 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute left-[15%] bottom-[15%] rotate-6">
            <Dumbbell className="h-28 w-28 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute right-[8%] bottom-[10%] -rotate-6">
            <Dumbbell className="h-20 w-20 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute left-[40%] top-[45%] rotate-45">
            <Dumbbell className="h-40 w-40 text-white" strokeWidth={1} />
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-transparent to-black/40" />

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <Dumbbell className="h-14 w-14 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">GymFlow CRM</h1>
          <p className="mt-3 text-lg text-blue-200">Gestão & Comunicação para Academias</p>
          <p className="mt-8 max-w-sm text-sm text-blue-300/80">
            Crie sua conta para acessar o painel de gestão.
          </p>
        </div>
      </div>

      {/* Right panel — signup form */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700">
              <Dumbbell className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">GymFlow CRM</h1>
          </div>

          <h2 className="text-2xl font-bold text-white">Criar Conta</h2>
          <p className="mt-2 text-sm text-gray-400">Cadastre-se para acessar o sistema</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="border-0 bg-gray-800 pl-10 text-white placeholder:text-gray-500 ring-gray-700 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="border-0 bg-gray-800 pl-10 text-white placeholder:text-gray-500 ring-gray-700 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="border-0 bg-gray-800 pl-10 text-white placeholder:text-gray-500 ring-gray-700 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="border-0 bg-gray-800 pl-10 text-white placeholder:text-gray-500 ring-gray-700 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-blue-900/30 px-3 py-2.5 text-xs text-blue-300 ring-1 ring-blue-800">
              <UserCircle className="h-4 w-4 shrink-0" />
              Novos cadastros são criados com perfil de Atendente.
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-900/40 px-3 py-2.5 text-sm text-red-400 ring-1 ring-red-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 py-2.5 hover:bg-blue-500">
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Já tem conta?{' '}
            <Link to="/login" className="font-medium text-blue-500 hover:text-blue-400">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
