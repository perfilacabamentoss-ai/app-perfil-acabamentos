
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  MessageSquare, 
  Smartphone, 
  Save, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  User,
  Upload,
  Download,
  Camera,
  Globe,
  Database,
  Key,
  Copy,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import { NotificationSettings, Collaborator } from '../types';
import ConfirmModal from './ConfirmModal';
import { clearAllSystemData } from '../utils/storage';
import { dataSync } from '../src/services/dataSync';
import { generateCollaboratorToken } from '../utils/token';

interface ConfiguracoesProps {
  readOnly?: boolean;
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

const Configuracoes: React.FC<ConfiguracoesProps> = ({ readOnly, theme, setTheme }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    whatsappNumber: '',
    whatsappEnabled: true,
    notifyExpiration: true,
    notifyLowStock: true,
    notifyNewInvoices: false,
    notifyDailySummary: true,
    notifyLateClockIn: true,
    expirationAdvanceDays: 15
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(dataSync.isSyncing);
  const [isConnected, setIsConnected] = useState(dataSync.isConnected);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean; name: string }>({
    isOpen: false,
    name: ''
  });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedCollabId, setSelectedCollabId] = useState<string>('');
  const [currentToken, setCurrentToken] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedCollabs = localStorage.getItem('perfil_collaborators');
    if (savedCollabs) {
      setCollaborators(JSON.parse(savedCollabs));
    }
  }, []);

  useEffect(() => {
    if (selectedCollabId) {
      const token = generateCollaboratorToken(selectedCollabId);
      setCurrentToken(token);
      
      const interval = setInterval(() => {
        setCurrentToken(generateCollaboratorToken(selectedCollabId));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCurrentToken('');
    }
  }, [selectedCollabId]);

  const handleCopyToken = () => {
    if (currentToken) {
      navigator.clipboard.writeText(currentToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportData = () => {
    const data: Record<string, string | null> = {};
    const keys = [
      'perfil_works', 'perfil_medicoes', 'perfil_payments', 'perfil_faturas',
      'perfil_collaborators', 'perfil_suppliers', 'perfil_contractors',
      'perfil_materials', 'perfil_qr_gallery', 'perfil_stages',
      'perfil_best_prices', 'perfil_projects', 'perfil_main_balance',
      'perfil_user', 'perfil_notification_settings', 'perfil_user_roles',
      'perfil_propostas', 'perfil_imported_projects'
    ];
    
    keys.forEach(key => {
      data[key] = localStorage.getItem(key);
    });
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_perfil_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          Object.entries(data).forEach(([key, value]) => {
            if (value !== null) {
              localStorage.setItem(key, value as string);
            }
          });
          alert('Dados importados com sucesso! O sistema será reiniciado.');
          window.location.reload();
        } catch (err) {
          alert('Erro ao importar arquivo. Verifique se o formato é válido.');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const handleRestore = () => {
    const dailyToken = new Date().toLocaleDateString('pt-BR').replace(/\//g, '');
    if (tokenInput.toUpperCase() === dailyToken) {
      localStorage.clear();
      window.location.reload();
    } else {
      setTokenError(true);
      setTimeout(() => setTokenError(false), 2000);
    }
  };

  const handleClearAll = () => {
    setConfirmAction({ isOpen: true, name: 'TODOS OS DADOS do sistema' });
  };

  const executeClearAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  useEffect(() => {
    dataSync.setOnSyncStateChange(setIsSyncing);
    dataSync.setOnConnectionChange(setIsConnected);

    const saved = localStorage.getItem('perfil_notification_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    const user = localStorage.getItem('perfil_user');
    if (user) {
      const parsed = JSON.parse(user);
      setProfilePhoto(parsed.photo);
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setProfilePhoto(base64);
        
        // Update user in localStorage immediately or on save
        const user = localStorage.getItem('perfil_user');
        if (user) {
          const parsed = JSON.parse(user);
          parsed.photo = base64;
          localStorage.setItem('perfil_user', JSON.stringify(parsed));
          // Dispatch event to notify App.tsx
          window.dispatchEvent(new Event('storage'));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem('perfil_notification_settings', JSON.stringify(settings));
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const handleBackup = () => {
    const allData: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('perfil_')) {
        allData[key] = localStorage.getItem(key);
      }
    }
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perfil_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        Object.entries(data).forEach(([key, value]) => {
          if (key.startsWith('perfil_') && value !== null) {
            localStorage.setItem(key, value as string);
          }
        });
        alert('Dados restaurados com sucesso! O sistema irá recarregar.');
        window.location.reload();
      } catch (err) {
        alert('Erro ao restaurar backup. Verifique o arquivo.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Gerencie as integrações e automações do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supabase Configuration Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Database size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Conexão Supabase</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Banco de dados em nuvem</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed">
                  Para habilitar a persistência em nuvem via Supabase, você precisa configurar as variáveis de ambiente no menu <b>Settings</b> do AI Studio.
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Script SQL Necessário:</p>
                  <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-[10px] font-mono overflow-x-auto">
{`create table if not exists system_data (
  key text primary key,
  value jsonb,
  updated_at timestamp with time zone default now()
);

-- Habilitar RLS se necessário, ou manter público para protótipo
alter table system_data enable row level security;
create policy "Permitir tudo para todos" on system_data for all using (true);`}
                  </pre>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Status da Conexão</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className={`text-sm font-black uppercase ${isConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Variáveis Necessárias</p>
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    VITE_SUPABASE_URL<br />
                    VITE_SUPABASE_ANON_KEY
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Settings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl">
                {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Tema do Sistema</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Escolha entre modo claro ou escuro</p>
              </div>
            </div>
            <div className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-3xl transition-all ${theme === 'dark' ? 'bg-slate-800 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                  {theme === 'dark' ? <Moon size={32} /> : <Sun size={32} />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                    Modo {theme === 'dark' ? 'Escuro' : 'Claro'} Ativo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {theme === 'dark' ? 'O sistema está otimizado para ambientes com pouca luz.' : 'O sistema está otimizado para ambientes bem iluminados.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setTheme?.(theme === 'light' ? 'dark' : 'light')}
                className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg flex items-center gap-3 ${
                  theme === 'dark' 
                    ? 'bg-amber-500 text-slate-900 shadow-amber-900/20' 
                    : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'
                }`}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                Alternar para Modo {theme === 'dark' ? 'Claro' : 'Escuro'}
              </button>
            </div>
          </div>

          {/* Profile Photo Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Perfil do Usuário</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Personalize sua identidade no sistema</p>
              </div>
            </div>
            <div className="p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-xl bg-slate-50 dark:bg-slate-800">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt="Perfil" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                      <User size={48} />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-[-10px] right-[-10px] p-3 bg-blue-600 text-white rounded-2xl shadow-lg cursor-pointer hover:bg-blue-700 transition-all hover:scale-110 active:scale-95">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Sua Foto de Perfil</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm">
                  Esta imagem será exibida no topo do sistema e na barra lateral. Recomendamos uma foto quadrada de alta resolução.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <label className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-2">
                    <Upload size={14} />
                    Alterar Foto
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                  {profilePhoto && (
                    <button 
                      onClick={() => {
                        setProfilePhoto(null);
                        const user = localStorage.getItem('perfil_user');
                        if (user) {
                          const parsed = JSON.parse(user);
                          parsed.photo = '';
                          localStorage.setItem('perfil_user', JSON.stringify(parsed));
                          window.dispatchEvent(new Event('storage'));
                        }
                      }}
                      className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Master Reset & Restore Card */}
          <div className="bg-rose-50 dark:bg-rose-950/20 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/30 shadow-sm overflow-hidden transition-colors">
            <div className="p-8 border-b border-rose-100 dark:border-rose-900/30 flex items-center justify-between bg-rose-100/30 dark:bg-rose-900/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500 text-white rounded-2xl">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight">Manutenção do Sistema</h2>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-widest">Gerenciamento de Dados e Backup</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleClearAll}
                  className="px-6 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 dark:shadow-rose-900/20 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Limpar Tudo (Dados Reais)
                </button>
                <button 
                  onClick={() => setShowRestoreModal(true)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 flex items-center gap-2"
                  title="Resetar para o padrão de fábrica"
                >
                  <RefreshCw size={14} />
                  Resetar Padrão
                </button>
              </div>
            </div>
            <div className="p-8">
              <p className="text-sm text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
                Utilize estas funções para gerenciar a integridade dos seus dados. O <b>Limpar Tudo</b> apaga todos os seus registros permanentemente. O <b>Resetar Padrão</b> exige um token de segurança diário.
              </p>
            </div>
          </div>

          {/* Backup & Export Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Save size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Backup & Exportação</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Proteja seus dados preenchidos</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Recomendamos exportar seus dados semanalmente para garantir que você tenha uma cópia de segurança de todas as obras, faturas e colaboradores.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleExportData}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/20 flex items-center gap-2"
                >
                  <Upload size={16} className="rotate-180" />
                  Exportar Backup (.JSON)
                </button>
                <label className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-2">
                  <Upload size={16} />
                  Importar Backup
                  <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
                </label>
              </div>
            </div>
          </div>

          {/* Mobile Access Link Card */}
          <div className="bg-blue-600 dark:bg-blue-700 rounded-[2.5rem] shadow-xl shadow-blue-200 dark:shadow-blue-900/20 overflow-hidden text-white transition-colors">
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-white/10 dark:bg-white/5 rounded-3xl backdrop-blur-md">
                  <Smartphone size={40} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Acesso Mobile Exclusivo</h2>
                  <p className="text-blue-100 dark:text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">Link de Acesso Direto para Administrador</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const adminUrl = `${window.location.origin}?role=admin`;
                  navigator.clipboard.writeText(adminUrl);
                  alert("Link de Administrador copiado! Envie para o seu celular via WhatsApp.");
                }}
                className="px-10 py-5 bg-white dark:bg-slate-100 text-blue-600 dark:text-blue-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 dark:hover:bg-white transition-all shadow-xl active:scale-95 flex items-center gap-3"
              >
                <Upload size={18} />
                Copiar Link Admin
              </button>
            </div>
            <div className="px-8 pb-8">
              <div className="p-4 bg-white/10 dark:bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-blue-100 dark:text-blue-200 leading-relaxed">
                  <b>DICA:</b> Ao abrir este link no seu celular, o sistema reconhecerá automaticamente seu acesso como <b>Administrador</b>, pulando a tela de login e liberando todos os módulos de Inteligência Perfil.
                </p>
              </div>
            </div>
          </div>

          {/* Collaborator Access Link Card */}
          <div className="bg-emerald-600 dark:bg-emerald-700 rounded-[2.5rem] shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 overflow-hidden text-white transition-colors">
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-white/10 dark:bg-white/5 rounded-3xl backdrop-blur-md">
                  <User size={40} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Portal do Colaborador</h2>
                  <p className="text-emerald-100 dark:text-emerald-200 text-xs font-bold uppercase tracking-widest mt-1">Link de Acesso Restrito para Equipe</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const collabUrl = `${window.location.origin}?role=colaborador`;
                  navigator.clipboard.writeText(collabUrl);
                  alert("Link do Portal do Colaborador copiado! Envie para o grupo da equipe.");
                }}
                className="px-10 py-5 bg-white dark:bg-slate-100 text-emerald-600 dark:text-emerald-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-50 dark:hover:bg-white transition-all shadow-xl active:scale-95 flex items-center gap-3"
              >
                <Upload size={18} />
                Copiar Link Equipe
              </button>
            </div>
            <div className="px-8 pb-8">
              <div className="p-4 bg-white/10 dark:bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-emerald-100 dark:text-emerald-200 leading-relaxed">
                  <b>DICA:</b> Este link dá acesso apenas ao <b>Portal do Colaborador</b>, onde eles podem ver seus dias trabalhados, horas extras, tarefas e o valor acumulado a receber.
                </p>
              </div>
            </div>
          </div>

          {/* Public Access Link Card */}
          <div className="bg-slate-800 dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200 dark:shadow-slate-950/20 overflow-hidden text-white transition-colors">
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-white/10 dark:bg-white/5 rounded-3xl backdrop-blur-md">
                  <Globe size={40} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Acesso Público (Comum)</h2>
                  <p className="text-slate-300 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Link para Clientes e Usuários Externos</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const publicUrl = `${window.location.origin}?role=publico`;
                  navigator.clipboard.writeText(publicUrl);
                  alert("Link de Acesso Público copiado! Divulgue para seus clientes.");
                }}
                className="px-10 py-5 bg-white dark:bg-slate-100 text-slate-800 dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 dark:hover:bg-white transition-all shadow-xl active:scale-95 flex items-center gap-3"
              >
                <Upload size={18} />
                Copiar Link Público
              </button>
            </div>
            <div className="px-8 pb-8">
              <div className="p-4 bg-white/10 dark:bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-300 dark:text-slate-400 leading-relaxed">
                  <b>DICA:</b> Este link é ideal para clientes. Ao acessar, eles serão direcionados para a tela de <b>Cadastro/Login</b>. Usuários comuns têm acesso limitado a ferramentas como Calculadoras Técnicas e consulta de serviços.
                </p>
              </div>
            </div>
          </div>

          {/* Individual Token Generation Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Key size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Gerar Token ao Colaborador</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Acesso Individual e Temporário</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Selecione o Colaborador</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all"
                  value={selectedCollabId}
                  onChange={(e) => setSelectedCollabId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {collaborators.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                  ))}
                </select>
              </div>

              {selectedCollabId && (
                <div className="flex flex-col md:flex-row items-center gap-4 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-800 animate-in zoom-in duration-300">
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Token Atual (Expira em 30s)</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white tracking-[0.2em] tabular-nums">{currentToken}</p>
                  </div>
                  <button 
                    onClick={handleCopyToken}
                    className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-lg ${
                      copied ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                    }`}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copiado!' : 'Copiar Token'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modals for Reset/Restore */}
          {showResetConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
              <div className="relative bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl max-w-md w-full text-center border border-white/10 dark:border-slate-800">
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirmar Reset Total?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 mb-8">Esta ação é irreversível. Todas as obras, pagamentos e faturas serão apagados permanentemente.</p>
                <div className="flex gap-4">
                  <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Cancelar</button>
                  <button 
                    onClick={() => {
                      clearAllSystemData();
                      setShowResetConfirm(false);
                    }} 
                    className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-rose-900/20"
                  >
                    Sim, Resetar
                  </button>
                </div>
              </div>
            </div>
          )}

          {showRestoreModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRestoreModal(false)} />
              <div className="relative bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl max-w-md w-full border border-white/10 dark:border-slate-800">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                    <RefreshCw size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Restaurar Dados</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Insira o token de segurança diário para resetar o sistema para o padrão de fábrica. <b>Atenção: Isso apagará todos os seus dados atuais.</b></p>
                <input 
                  type="text"
                  placeholder="TOKEN DIÁRIO"
                  className={`w-full p-4 bg-slate-50 dark:bg-slate-800 border ${tokenError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl outline-none font-black text-center text-xl tracking-[0.5em] uppercase text-slate-900 dark:text-white`}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
                {tokenError && <p className="text-rose-500 text-[10px] font-bold uppercase mt-2 text-center">Token Inválido ou Expirado</p>}
                <div className="flex gap-4 mt-8">
                  <button onClick={() => setShowRestoreModal(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Cancelar</button>
                  <button 
                    onClick={handleRestore}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20"
                  >
                    Resetar Padrão
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <MessageSquare size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Integração WhatsApp</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Automação de Alertas em Tempo Real</p>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl transition-colors ${settings.whatsappEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Ativar Notificações WhatsApp</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Habilitar envio de alertas automáticos</p>
                  </div>
                </div>
                <button 
                  onClick={() => !readOnly && setSettings({...settings, whatsappEnabled: !settings.whatsappEnabled})}
                  disabled={readOnly}
                  className={`w-14 h-7 rounded-full transition-all relative ${settings.whatsappEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.whatsappEnabled ? 'left-8' : 'left-1'}`} />
                </button>
              </div>

              <div className={`space-y-3 transition-opacity ${settings.whatsappEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone size={14} className="text-blue-500" />
                  Número para Notificações (WhatsApp)
                </label>
                <div className="relative max-w-md">
                  <input 
                    type="text" 
                    placeholder="(61) 99999-9999"
                    className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-black text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 transition-all text-lg ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                    value={settings.whatsappNumber}
                    onChange={e => !readOnly && setSettings({...settings, whatsappNumber: e.target.value})}
                    readOnly={readOnly}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className={settings.whatsappNumber.length > 10 ? "text-emerald-500" : "text-slate-200 dark:text-slate-700"} size={20} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">As notificações de validade e estoque baixo serão enviadas para este número.</p>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 transition-opacity ${settings.whatsappEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-blue-500" />
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Alertas de Validade</span>
                    </div>
                    <button 
                      onClick={() => !readOnly && setSettings({...settings, notifyExpiration: !settings.notifyExpiration})}
                      disabled={readOnly}
                      className={`w-12 h-6 rounded-full transition-all relative ${settings.notifyExpiration ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notifyExpiration ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Antecedência (Dias)</label>
                    <input 
                      type="number" 
                      className={`w-20 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                      value={settings.expirationAdvanceDays}
                      onChange={e => !readOnly && setSettings({...settings, expirationAdvanceDays: Number(e.target.value)})}
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap size={18} className="text-amber-500" />
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Estoque Baixo</span>
                  </div>
                  <button 
                    onClick={() => !readOnly && setSettings({...settings, notifyLowStock: !settings.notifyLowStock})}
                    disabled={readOnly}
                    className={`w-12 h-6 rounded-full transition-all relative ${settings.notifyLowStock ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notifyLowStock ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Resumo Diário</span>
                  </div>
                  <button 
                    onClick={() => !readOnly && setSettings({...settings, notifyDailySummary: !settings.notifyDailySummary})}
                    disabled={readOnly}
                    className={`w-12 h-6 rounded-full transition-all relative ${settings.notifyDailySummary ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notifyDailySummary ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={18} className="text-rose-500" />
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Novas Faturas</span>
                  </div>
                  <button 
                    onClick={() => !readOnly && setSettings({...settings, notifyNewInvoices: !settings.notifyNewInvoices})}
                    disabled={readOnly}
                    className={`w-12 h-6 rounded-full transition-all relative ${settings.notifyNewInvoices ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notifyNewInvoices ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-indigo-500" />
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Atraso de Ponto (15 min)</span>
                  </div>
                  <button 
                    onClick={() => !readOnly && setSettings({...settings, notifyLateClockIn: !settings.notifyLateClockIn})}
                    disabled={readOnly}
                    className={`w-12 h-6 rounded-full transition-all relative ${settings.notifyLateClockIn ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notifyLateClockIn ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              {!readOnly && (
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl ${
                    showSuccess ? 'bg-emerald-500 text-white shadow-emerald-200 dark:shadow-emerald-900/20' : 'bg-blue-600 text-white shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700'
                  }`}
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : showSuccess ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {isSaving ? 'Salvando...' : showSuccess ? 'Configurações Salvas' : 'Salvar Alterações'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Info/Status */}
        <div className="space-y-6">
          <div className="bg-[#0b1222] dark:bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck size={120} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight relative z-10">Status da API</h3>
            <div className="mt-6 space-y-4 relative z-10">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Supabase Cloud</span>
                <span className={`flex items-center gap-2 text-[10px] font-black uppercase ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Sincronização</span>
                <span className={`text-[10px] font-black uppercase ${isSyncing ? 'text-blue-400' : 'text-slate-400'}`}>
                  {isSyncing ? 'Sincronizando...' : 'Atualizado'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Instância WA</span>
                <span className="text-[10px] font-black text-amber-400 uppercase">Aguardando QR Code</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 mt-8">
              <button 
                onClick={() => dataSync.forceSync()}
                disabled={isSyncing}
                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-3"
              >
                <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                Forçar Sincronização
              </button>
              <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40">
                Conectar WhatsApp
              </button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[2.5rem] border border-blue-100 dark:border-blue-800 transition-colors">
            <h4 className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase tracking-tight mb-4">Backup de Segurança</h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-6">
              Exporte todos os seus dados para um arquivo local ou restaure um backup anterior para garantir que seus dados nunca se percam.
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleBackup}
                className="w-full py-4 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-700 hover:text-white transition-all flex items-center justify-center gap-3"
              >
                <Download size={16} />
                Exportar Backup (JSON)
              </button>
              <label className="w-full py-4 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-700 hover:text-white transition-all flex items-center justify-center gap-3 cursor-pointer">
                <Upload size={16} />
                Importar Backup
                <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
              </label>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[2.5rem] border border-blue-100 dark:border-blue-800 mt-6 transition-colors">
            <h4 className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase tracking-tight mb-4">Como funciona?</h4>
            <ul className="space-y-4">
              {[
                'Alertas automáticos de vencimento de materiais.',
                'Notificações de estoque abaixo do limite mínimo.',
                'Resumo diário de atividades da obra.',
                'Confirmação de pagamentos e faturas.'
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-xs font-medium text-blue-700 dark:text-blue-300 leading-relaxed">
                  <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl">
                <ShieldCheck size={20} />
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Segurança</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
              Gerencie os perfis de acesso e determine quais telas cada colaborador pode visualizar.
            </p>
            <button 
              onClick={() => {
                // This assumes we have access to setActiveView, but we don't in this component.
              }}
              className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
            >
              Configurar Acessos
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeClearAll}
        title="Limpar Tudo"
        message={`Tem certeza que deseja apagar ${confirmAction.name}? Esta ação é irreversível e todos os dados serão perdidos.`}
        confirmText="Apagar Tudo"
      />
    </div>
  );
};

export default Configuracoes;
