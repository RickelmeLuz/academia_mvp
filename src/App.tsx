import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Cadastro } from '@/pages/Cadastro';
import { Dashboard } from '@/pages/Dashboard';
import { AlunosList } from '@/pages/alunos/AlunosList';
import { AlunoDetail } from '@/pages/alunos/AlunoDetail';
import { Leads } from '@/pages/Leads';
import { Planos } from '@/pages/Planos';
import { Matriculas } from '@/pages/Matriculas';
import { Mensalidades } from '@/pages/Mensalidades';
import { Templates } from '@/pages/Templates';
import { Regras } from '@/pages/Regras';
import { Comunicacoes } from '@/pages/Comunicacoes';
import { Tarefas } from '@/pages/Tarefas';
import { useAuth } from '@/lib/auth';
import { PageLoader } from '@/components/ui/Spinner';

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="alunos" element={<AlunosList />} />
        <Route path="alunos/:id" element={<AlunoDetail />} />
        <Route path="leads" element={<Leads />} />
        <Route path="planos" element={<Planos />} />
        <Route path="matriculas" element={<Matriculas />} />
        <Route path="mensalidades" element={<Mensalidades />} />
        <Route path="templates" element={<Templates />} />
        <Route path="regras" element={<Regras />} />
        <Route path="comunicacoes" element={<Comunicacoes />} />
        <Route path="tarefas" element={<Tarefas />} />
      </Route>
    </Routes>
  );
}

function App() {
  const { session, loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/cadastro" element={session ? <Navigate to="/" replace /> : <Cadastro />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
