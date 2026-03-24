
import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, Phone, UserPlus, ArrowLeft } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface LoginProps {
  onLogin: (user: any) => void;
}

const LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEjRUQCeZnEJue8_9Hx-MgK6LIqJ2K1WFc9xgLwf_IZQ&s";
const PROFILE_PHOTO = "https://storage.googleapis.com/a1aa/image/Vq3L9m_O6_r_R-16_0_0_0_0.jpg";
const GOLDEN_HELMET_STYLE = { filter: "sepia(0.5) saturate(2) brightness(1.1)" };

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('role') === 'publico' ? 'signup' : 'login';
  });
  const [userType, setUserType] = useState<'admin' | 'user'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    return (role === 'colaborador' || role === 'publico') ? 'user' : 'admin';
  });
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Pre-configured Admins
  const ADMIN_EMAILS = [
    'perfilacabamentoss@gmail.com',
    'pedroteixeira235@gmail.com',
    'marcelacarlafeitosadelima@gmail.com'
  ];
  const ADMIN_PASS = 'Da27113145%';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        onLogin({
          id: user.uid,
          name: user.displayName || '',
          email: user.email,
          photo: user.photoURL || PROFILE_PHOTO,
          role: userType === 'admin' ? 'admin' : 'user'
        });
      } else {
        // Signup Mode
        if (!name || !whatsapp || !email || !password) {
          setError('Preencha todos os campos para o cadastro.');
          setIsLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, {
          displayName: name,
          photoURL: LOGO_URL
        });

        alert('Cadastro realizado com sucesso! Agora você pode entrar.');
        setMode('login');
        setUserType('user');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Erro na autenticação.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      onLogin({
        id: user.uid,
        name: user.displayName || '',
        email: user.email,
        photo: user.photoURL || PROFILE_PHOTO,
        role: userType === 'admin' ? 'admin' : 'user'
      });
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(err.message || 'Erro na autenticação com Google.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1222] dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 dark:bg-blue-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 dark:bg-blue-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 dark:border-slate-800 transition-colors">
          <div className="p-8 bg-[#0b1222] dark:bg-slate-950 text-white flex flex-col items-center text-center border-b border-slate-800 dark:border-slate-900">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl shadow-amber-600/40 mb-4 flex items-center justify-center border-2 border-white/20 bg-slate-800 dark:bg-slate-900">
              <img 
                src={PROFILE_PHOTO} 
                alt="Admin" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/perfil/200/200';
                }}
              />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase leading-none">Perfil</h1>
            <p className="text-blue-400 text-[8px] font-black uppercase mt-2 tracking-[0.3em]">Gestão de Obras & Acabamentos</p>
          </div>

          <div className="p-8 space-y-6">
            {mode === 'login' && (
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button 
                  onClick={() => setUserType('admin')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${userType === 'admin' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Administrador
                </button>
                <button 
                  onClick={() => setUserType('user')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${userType === 'user' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Usuário
                </button>
              </div>
            )}

            <div className="text-center">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {mode === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                {new URLSearchParams(window.location.search).get('role') === 'colaborador' 
                  ? 'Portal do Colaborador - Identifique-se'
                  : (new URLSearchParams(window.location.search).get('role') === 'publico'
                    ? 'Acesso Público - Cadastre-se ou Entre'
                    : (mode === 'login' 
                      ? (userType === 'admin' ? 'Acesso restrito à diretoria' : 'Acesse com seu E-mail')
                      : 'Cadastre-se para acessar o sistema'))}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'login' && (
                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-3 mb-2"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                  Entrar com Google
                </button>
              )}

              <div className="relative flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ou e-mail</span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
              </div>
              {mode === 'signup' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" size={16} />
                      <input 
                        type="text" 
                        required
                        placeholder="Seu nome"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Número do WhatsApp</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" size={16} />
                      <input 
                        type="tel" 
                        required
                        placeholder="(00) 00000-0000"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  {userType === 'admin' ? 'E-mail Administrador' : 'E-mail (Gmail)'}
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" size={16} />
                  <input 
                    type="email" 
                    required
                    placeholder="exemplo@gmail.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" size={16} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 animate-in shake duration-300">
                  <ShieldCheck size={16} />
                  <p className="text-[9px] font-black uppercase tracking-widest">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    {mode === 'login' ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
                    <Lock size={12} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3">
              {mode === 'login' ? (
                userType === 'user' && (
                  <button 
                    onClick={() => setMode('signup')}
                    className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-2"
                  >
                    <UserPlus size={12} />
                    Não tem conta? Cadastre-se agora
                  </button>
                )
              ) : (
                <button 
                  onClick={() => setMode('login')}
                  className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:underline flex items-center gap-2"
                >
                  <ArrowLeft size={12} />
                  Já tem conta? Voltar ao login
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} />
            <span className="text-[8px] font-black uppercase tracking-widest">Conexão Segura</span>
          </div>
          <div className="w-1 h-1 bg-slate-700 dark:bg-slate-600 rounded-full"></div>
          <span className="text-[8px] font-black uppercase tracking-widest">v2.5.0</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
