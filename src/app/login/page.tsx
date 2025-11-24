'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured, checkSupabaseConnection } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Apple, Mail, Lock, User, Scale, Target, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectionError, setConnectionError] = useState('');
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    weightCurrent: '',
    weightGoal: '',
  });

  // Prevent multiple simultaneous requests
  const isProcessing = useRef(false);

  // Verificar conexão ao montar componente
  useEffect(() => {
    const verifyConnection = async () => {
      if (!isSupabaseConfigured()) {
        setConnectionError('⚠️ Supabase não configurado. Clique em "Configurar" no banner laranja acima para adicionar suas credenciais.');
        return;
      }

      const { connected, error: connError } = await checkSupabaseConnection();
      if (!connected) {
        setConnectionError(`⚠️ Erro de conexão: ${connError || 'Não foi possível conectar ao Supabase'}`);
      } else {
        setConnectionError('');
      }
    };

    verifyConnection();
  }, []);

  // Função para traduzir erros do Supabase
  const translateError = (errorMessage: string): string => {
    // Erros de rede
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NETWORK_ERROR')) {
      return '❌ Erro de conexão. Verifique se o Supabase está configurado corretamente no banner laranja acima.';
    }
    if (errorMessage.includes('NETWORK_TIMEOUT')) {
      return '⏱️ Tempo de conexão esgotado. Tente novamente.';
    }

    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'Email not confirmed': 'Email não confirmado',
      'User already registered': 'Este email já está cadastrado',
      'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
      'Unable to validate email address: invalid format': 'Formato de email inválido',
      'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos',
      'Signup requires a valid password': 'É necessário fornecer uma senha válida',
      'User not found': 'Usuário não encontrado',
      'Invalid email or password': 'Email ou senha inválidos',
      'Email link is invalid or has expired': 'Link de email inválido ou expirado',
      'Token has expired or is invalid': 'Sessão expirada. Faça login novamente',
      'New password should be different from the old password': 'A nova senha deve ser diferente da anterior',
    };

    // Procura por correspondências parciais
    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    // Se não encontrar correspondência, retorna mensagem genérica
    return 'Ocorreu um erro. Tente novamente';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar configuração antes de tentar login
    if (!isSupabaseConfigured()) {
      setError('⚠️ Configure o Supabase primeiro. Clique em "Configurar" no banner laranja acima.');
      return;
    }

    // Prevent multiple simultaneous requests
    if (isProcessing.current || loading) {
      return;
    }

    isProcessing.current = true;
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setSuccess('Login realizado com sucesso! Redirecionando...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const translatedError = translateError(err.message || 'Erro desconhecido');
      setError(translatedError);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isProcessing.current = false;
      }, 2000);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar configuração antes de tentar signup
    if (!isSupabaseConfigured()) {
      setError('⚠️ Configure o Supabase primeiro. Clique em "Configurar" no banner laranja acima.');
      return;
    }

    // Prevent multiple simultaneous requests
    if (isProcessing.current || loading) {
      return;
    }

    isProcessing.current = true;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create auth user with autoConfirm option
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            name: signupData.name,
          },
          emailRedirectTo: undefined,
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // Check if email confirmation is required
      if (authData.session) {
        // User is already logged in (email confirmation disabled)
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: authData.user.id,
          name: signupData.name,
          weight_current: parseFloat(signupData.weightCurrent),
          weight_goal: parseFloat(signupData.weightGoal),
          weight_initial: parseFloat(signupData.weightCurrent),
        });

        if (profileError) {
          console.warn('Profile creation warning:', profileError);
        }

        // Create initial daily stats
        const today = new Date().toISOString().split('T')[0];
        const { error: statsError } = await supabase.from('daily_stats').insert({
          user_id: authData.user.id,
          date: today,
          steps: 0,
          water_glasses: 0,
          sleep_hours: 0,
        });

        if (statsError) {
          console.warn('Stats creation warning:', statsError);
        }

        setSuccess('Conta criada com sucesso! Redirecionando...');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        // Email confirmation is required - need to login manually
        setSuccess('Conta criada! Fazendo login...');
        
        // Try to login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: signupData.email,
          password: signupData.password,
        });

        if (loginError) {
          throw new Error('Conta criada, mas erro ao fazer login. Tente fazer login manualmente.');
        }

        if (loginData.user) {
          // Create profile after successful login
          const { error: profileError } = await supabase.from('profiles').insert({
            user_id: loginData.user.id,
            name: signupData.name,
            weight_current: parseFloat(signupData.weightCurrent),
            weight_goal: parseFloat(signupData.weightGoal),
            weight_initial: parseFloat(signupData.weightCurrent),
          });

          if (profileError) {
            console.warn('Profile creation warning:', profileError);
          }

          // Create initial daily stats
          const today = new Date().toISOString().split('T')[0];
          const { error: statsError } = await supabase.from('daily_stats').insert({
            user_id: loginData.user.id,
            date: today,
            steps: 0,
            water_glasses: 0,
            sleep_hours: 0,
          });

          if (statsError) {
            console.warn('Stats creation warning:', statsError);
          }

          setSuccess('Conta criada com sucesso! Redirecionando...');
          
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        }
      }

    } catch (err: any) {
      console.error('Signup error:', err);
      const translatedError = translateError(err.message || 'Erro desconhecido');
      setError(translatedError);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isProcessing.current = false;
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl mb-4 shadow-lg">
            <Apple className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo de volta!
          </h1>
          <p className="text-gray-600">
            Continue sua jornada de saúde e bem-estar
          </p>
        </div>

        {/* Connection Error Alert */}
        {connectionError && (
          <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-900 mb-1">
                  Configuração Necessária
                </p>
                <p className="text-sm text-orange-700">
                  {connectionError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => {
                if (!loading) {
                  setIsLogin(true);
                  setError('');
                  setSuccess('');
                }
              }}
              disabled={loading}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                isLogin
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              } disabled:opacity-50`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                if (!loading) {
                  setIsLogin(false);
                  setError('');
                  setSuccess('');
                }
              }}
              disabled={loading}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                !isLogin
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              } disabled:opacity-50`}
            >
              Cadastrar
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
              {success}
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured()}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            // Signup Form
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="Seu nome"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Peso Atual (kg)
                  </label>
                  <div className="relative">
                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.1"
                      value={signupData.weightCurrent}
                      onChange={(e) => setSignupData({ ...signupData, weightCurrent: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                      placeholder="78.0"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meta (kg)
                  </label>
                  <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.1"
                      value={signupData.weightGoal}
                      onChange={(e) => setSignupData({ ...signupData, weightGoal: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                      placeholder="70.0"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured()}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="text-emerald-600 font-semibold hover:underline">
            Termos de Uso
          </a>
        </p>
      </div>
    </div>
  );
}
