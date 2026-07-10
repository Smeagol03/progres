import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ReadOnlyProvider } from './contexts/ReadOnlyContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PaketList from './pages/PaketList';
import PaketForm from './pages/PaketForm';

function App() {
  return (
    <AuthProvider>
      <ReadOnlyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/paket" element={<PaketList />} />
              <Route path="/paket/baru" element={<PaketForm />} />
              <Route path="/paket/:id" element={<PaketForm />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ReadOnlyProvider>
    </AuthProvider>
  );
}

export default App;
