import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Lock, Mail, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      navigate('/');
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Left panel — branding with dumbbell pattern */}
      <div className="relative hidden w-1/2 overflow-hidden bg-blue-700 lg:flex lg:flex-col lg:items-center lg:justify-center">
        {/* Decorative dumbbell pattern */}
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

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-transparent to-black/40" />

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <Dumbbell className="h-14 w-14 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">GymFlow CRM</h1>
          <p className="mt-3 text-lg text-blue-200">Gestão & Comunicação para Academias</p>
          <p className="mt-8 max-w-sm text-sm text-blue-300/80">
            Centralize leads, alunos, mensalidades e comunicação em um só lugar.
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700">
              <Dumbbell className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">GymFlow CRM</h1>
          </div>

          <h2 className="text-2xl font-bold text-white">Entrar</h2>
          <p className="mt-2 text-sm text-gray-400">Acesse o painel de gestão da academia</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                  placeholder="••••••••"
                  className="border-0 bg-gray-800 pl-10 text-white placeholder:text-gray-500 ring-gray-700 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-900/40 px-3 py-2.5 text-sm text-red-400 ring-1 ring-red-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 py-2.5 hover:bg-blue-500">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Não tem conta?{' '}
            <Link to="/cadastro" className="font-medium text-blue-500 hover:text-blue-400">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
