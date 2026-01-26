import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, isMock } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const res = await signIn(email, password);
    
    if (res.error) {
      setError(res.error.message || "Erro ao fazer login");
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-6">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full border border-gray-100 animate-slide-up">
        <div className="text-center mb-8">
            <h2 className="font-display font-black text-2xl text-brand-900 uppercase">Área Admin</h2>
            <div className="w-8 h-1 bg-brand-500 rounded-full mx-auto mt-2"></div>
        </div>

        {isMock && (
            <div className="bg-brand-50 border border-brand-200 text-brand-800 text-xs p-3 rounded mb-4">
                <strong>Modo Demo:</strong><br/>
                Email: admin@lojinha.com<br/>
                Senha: admin
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded p-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Senha</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded p-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    required
                />
            </div>

            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded uppercase tracking-widest text-xs transition-colors disabled:opacity-50"
            >
                {loading ? 'Entrando...' : 'Entrar'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default Login;