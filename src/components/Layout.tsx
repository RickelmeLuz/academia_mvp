import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, LayoutDashboard, Users, UserPlus, CreditCard, Receipt, MessageSquare, Send, ListTodo, FileText, Workflow, LogOut, ShieldCheck, UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/alunos', label: 'Alunos', icon: Users },
  { to: '/leads', label: 'Leads', icon: UserPlus },
  { to: '/planos', label: 'Planos', icon: CreditCard },
  { to: '/matriculas', label: 'Matrículas', icon: FileText },
  { to: '/mensalidades', label: 'Mensalidades', icon: Receipt },
  { to: '/templates', label: 'Templates', icon: MessageSquare },
  { to: '/regras', label: 'Regras de Automação', icon: Workflow },
  { to: '/comunicacoes', label: 'Comunicações', icon: Send },
  { to: '/tarefas', label: 'Tarefas', icon: ListTodo },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const userMeta = user?.user_metadata ?? {};
  const nome = (userMeta.nome as string) ?? user?.email ?? 'Usuário';
  const cargo = (userMeta.cargo as string) ?? 'Staff';
  const role = user?.app_metadata?.role as string;
  const isAdmin = role === 'admin';

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gray-800 bg-gray-950 lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-800 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">GymFlow CRM</h1>
            <p className="text-xs text-gray-500">Gestão & Comunicação</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-gray-800 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${isAdmin ? 'bg-blue-600' : 'bg-gray-600'}`}>
              {nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{nome}</p>
              <div className="flex items-center gap-1">
                {isAdmin ? (
                  <ShieldCheck className="h-3 w-3 text-blue-500" />
                ) : (
                  <UserCircle className="h-3 w-3 text-gray-500" />
                )}
                <p className="text-xs text-gray-500">{cargo}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-800 bg-gray-950 px-4 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <Dumbbell className="h-5 w-5 text-white" />
        </div>
        <span className="text-sm font-bold text-white">GymFlow CRM</span>
        <select
          value={location.pathname}
          onChange={(e) => navigate(e.target.value)}
          className="ml-auto rounded-lg border-gray-700 bg-gray-800 py-1.5 text-sm text-white"
        >
          {navItems.map((item) => (
            <option key={item.to} value={item.to}>
              {item.label}
            </option>
          ))}
        </select>
        <button onClick={handleSignOut} className="text-gray-400 hover:text-white">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:pl-64">
        <div className="min-h-screen pt-16 lg:pt-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>

          {/* Footer with dumbbell decoration in empty space */}
          <footer className="mt-12 border-t border-gray-200 px-4 pb-6 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 text-sm text-gray-400">
              <Dumbbell className="h-4 w-4 text-blue-500" />
              <span>GymFlow CRM — Sistema de Gestão para Academias</span>
              <Dumbbell className="h-4 w-4 text-blue-500" />
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
