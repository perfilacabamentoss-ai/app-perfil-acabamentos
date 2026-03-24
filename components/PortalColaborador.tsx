
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Hammer, 
  User,
  ChevronRight,
  History,
  Briefcase,
  Key,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { TimeLog, Collaborator, ProjectStage, View } from '../types';
import { generateCollaboratorToken } from '../utils/token';

const PortalColaborador: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(() => {
    const saved = localStorage.getItem('perfil_portal_collab_id');
    return saved || null;
  });
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Check persistent verification and attendance
  useEffect(() => {
    if (!selectedCollabId || collaborators.length === 0) return;

    const verifiedCollabs = JSON.parse(localStorage.getItem('perfil_portal_verified_collabs') || '{}');
    const lastVerified = verifiedCollabs[selectedCollabId];

    if (lastVerified) {
      // Check if any weekday was missed since last verification
      const lastDate = new Date(lastVerified);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let missedDay = false;
      const checkDate = new Date(lastDate);
      checkDate.setDate(checkDate.getDate() + 1); // Start from the day after verification

      while (checkDate < today) {
        const dayOfWeek = checkDate.getDay();
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

        if (isWeekday) {
          const dateStr = checkDate.toISOString().split('T')[0];
          const hasLog = logs.some(l => {
            const isSameCollab = l.collaboratorId === selectedCollabId || l.collaboratorName.includes(collaborators.find(c => c.id === selectedCollabId)?.name || '');
            return isSameCollab && l.date === dateStr && l.type === 'Entrada';
          });

          if (!hasLog) {
            missedDay = true;
            break;
          }
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }

      if (missedDay) {
        // Invalidate session
        delete verifiedCollabs[selectedCollabId];
        localStorage.setItem('perfil_portal_verified_collabs', JSON.stringify(verifiedCollabs));
        setIsTokenVerified(false);
      } else {
        setIsTokenVerified(true);
      }
    } else {
      setIsTokenVerified(false);
    }
  }, [selectedCollabId, collaborators, logs]);

  useEffect(() => {
    const loadData = () => {
      const savedLogs = localStorage.getItem('perfil_time_logs');
      if (savedLogs) setLogs(JSON.parse(savedLogs));

      const savedCollabs = localStorage.getItem('perfil_collaborators');
      if (savedCollabs) setCollaborators(JSON.parse(savedCollabs));

      const savedStages = localStorage.getItem('perfil_etapas');
      if (savedStages) setStages(JSON.parse(savedStages));
    };

    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('perfil_sync_complete', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('perfil_sync_complete', loadData);
    };
  }, []);

  useEffect(() => {
    if (selectedCollabId) {
      localStorage.setItem('perfil_portal_collab_id', selectedCollabId);
    }
  }, [selectedCollabId]);

  const currentCollab = useMemo(() => 
    collaborators.find(c => c.id === selectedCollabId)
  , [collaborators, selectedCollabId]);

  const handleVerifyToken = () => {
    if (!currentCollab) return;
    const validToken = generateCollaboratorToken(currentCollab.id);
    if (tokenInput === validToken) {
      // Save verification
      const verifiedCollabs = JSON.parse(localStorage.getItem('perfil_portal_verified_collabs') || '{}');
      verifiedCollabs[currentCollab.id] = new Date().toISOString();
      localStorage.setItem('perfil_portal_verified_collabs', JSON.stringify(verifiedCollabs));
      
      setIsTokenVerified(true);
      setTokenError(false);
    } else {
      setTokenError(true);
      setTokenInput('');
      // Shake effect or something
      setTimeout(() => setTokenError(false), 500);
    }
  };

  const collabLogs = useMemo(() => {
    if (!currentCollab) return [];
    return logs.filter(l => l.collaboratorName.includes(currentCollab.name) || l.collaboratorId === currentCollab.id);
  }, [logs, currentCollab]);

  const collabStages = useMemo(() => {
    if (!currentCollab) return [];
    return stages.filter(s => s.responsible === currentCollab.name);
  }, [stages, currentCollab]);

  const monthlyStats = useMemo(() => {
    if (!currentCollab) return { days: 0, hours: 0, extraHours: 0, totalPay: 0 };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter logs for current month
    // Note: TimeLog timestamp is currently a string like "10:30:00". 
    // In a real app we'd need the full date. Assuming logs are for the current month for simplicity in this demo.
    // Or we'd need to update TimeLog to include date.
    
    // For this calculation, let's assume each 'Entrada' counts as a day if it's unique per day.
    const uniqueDays = new Set();
    let totalMinutes = 0;
    let lastEntrada: Date | null = null;

    // Sort logs by time
    collabLogs.forEach(log => {
      // Use T to ensure local time parsing or be consistent
      const logDate = new Date(`${log.date}T${log.timestamp}`);
      
      if (log.type === 'Entrada') {
        lastEntrada = logDate;
        uniqueDays.add(log.date);
      } else if (log.type === 'Saída' && lastEntrada) {
        const diff = (logDate.getTime() - lastEntrada.getTime()) / (1000 * 60);
        if (diff > 0) totalMinutes += diff;
        lastEntrada = null;
      }
    });

    const daysWorked = uniqueDays.size;
    const totalHours = totalMinutes / 60;
    
    // Extra hours: assuming 8h per day for weekdays, all hours for weekends
    let standardHours = 0;
    uniqueDays.forEach(dateStr => {
      // Add T00:00:00 to avoid UTC shift
      const d = new Date(`${dateStr}T00:00:00`);
      const dayOfWeek = d.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        standardHours += 8;
      }
    });

    const extraHours = Math.max(0, totalHours - standardHours);

    // Pay calculation
    let totalPay = 0;
    if (currentCollab.payType === 'Diária') {
      totalPay = daysWorked * currentCollab.payValue;
    } else if (currentCollab.payType === 'Mensal') {
      // Proportion of month or full? User said "acumulados até o fechamento"
      // Let's assume they get a daily rate derived from monthly if we want to show accumulation
      const dailyRate = currentCollab.payValue / 22;
      totalPay = daysWorked * dailyRate;
    } else if (currentCollab.payType === 'Semanal') {
      const dailyRate = currentCollab.payValue / 5;
      totalPay = daysWorked * dailyRate;
    }

    // Add extra hours pay (assuming 50% more)
    const hourlyRate = (currentCollab.payType === 'Diária' ? currentCollab.payValue / 8 : (currentCollab.payValue / 22) / 8);
    totalPay += extraHours * hourlyRate * 1.5;

    return {
      days: daysWorked,
      hours: totalHours,
      extraHours,
      totalPay
    };
  }, [collabLogs, currentCollab]);

  if (!selectedCollabId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 md:p-8 text-center animate-in fade-in duration-500">
        <div className="bg-blue-50 p-6 rounded-full mb-6 text-blue-600">
          <User size={48} className="md:w-16 md:h-16" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Portal do Colaborador</h2>
        <p className="text-slate-500 mt-2 max-w-md text-xs md:text-sm">Selecione seu nome abaixo para acessar seus apontamentos, horas extras e valores a receber.</p>
        
        <div className="mt-8 w-full max-w-md space-y-3">
          {collaborators.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCollabId(c.id)}
              className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-500 hover:shadow-lg active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors overflow-hidden">
                  {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <User size={24} />}
                </div>
                <div className="text-left">
                  <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{c.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{c.role}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500" />
            </button>
          ))}
          {collaborators.length === 0 && (
            <div className="p-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 italic text-sm">Nenhum colaborador cadastrado no sistema.</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={onLogout}
          className="mt-12 w-full max-w-md py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
        >
          Sair do Sistema
        </button>
      </div>
    );
  }

  if (!isTokenVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 md:p-8 text-center animate-in fade-in duration-500">
        <div className="relative mb-12">
          {/* Central Circle */}
          <button 
            onClick={() => setShowTokenInput(true)}
            className={`w-48 h-48 md:w-64 md:h-64 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl relative z-10 ${
              tokenError 
                ? 'bg-rose-500 text-white animate-shake' 
                : 'bg-blue-600 text-white hover:scale-105 active:scale-95 shadow-blue-600/30'
            }`}
          >
            <Key size={48} className="mb-4" />
            <span className="font-black uppercase tracking-[0.2em] text-xs">Validar Acesso</span>
            <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping opacity-20"></div>
          </button>
          
          {/* User Info below circle */}
          <div className="mt-8">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{currentCollab?.name}</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Insira o token enviado pelo administrador</p>
          </div>
        </div>

        {showTokenInput && (
          <div className="w-full max-w-xs space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="relative">
              <input 
                type="text" 
                maxLength={6}
                autoFocus
                placeholder="000000"
                className={`w-full py-5 bg-white border-2 rounded-2xl text-center text-3xl font-black tracking-[0.5em] outline-none transition-all ${
                  tokenError ? 'border-rose-500 text-rose-500' : 'border-slate-100 focus:border-blue-500 text-slate-900'
                }`}
                value={tokenInput}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setTokenInput(val);
                  if (val.length === 6) {
                    // Auto-verify when 6 digits are entered
                    const validToken = generateCollaboratorToken(currentCollab!.id);
                    if (val === validToken) {
                      // Save verification
                      const verifiedCollabs = JSON.parse(localStorage.getItem('perfil_portal_verified_collabs') || '{}');
                      verifiedCollabs[currentCollab!.id] = new Date().toISOString();
                      localStorage.setItem('perfil_portal_verified_collabs', JSON.stringify(verifiedCollabs));

                      setIsTokenVerified(true);
                      setTokenError(false);
                    } else {
                      setTokenError(true);
                      setTokenInput('');
                      setTimeout(() => setTokenError(false), 500);
                    }
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowTokenInput(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest"
              >
                Voltar
              </button>
              <button 
                onClick={handleVerifyToken}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20"
              >
                Verificar
              </button>
            </div>
          </div>
        )}

        <button 
          onClick={() => setSelectedCollabId(null)}
          className="mt-12 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-blue-600 transition-colors"
        >
          Trocar Colaborador
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
            {currentCollab?.photo ? (
              <img src={currentCollab.photo} className="w-full h-full object-cover" />
            ) : (
              <User size={28} />
            )}
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              Olá, {currentCollab?.name.split(' ')[0]}
            </h1>
            <p className="text-slate-500 mt-1 md:mt-2 text-[10px] md:text-sm font-medium flex items-center gap-2">
              <Briefcase size={12} className="text-blue-600" /> {currentCollab?.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
          <button 
            onClick={() => setSelectedCollabId(null)}
            className="flex-1 md:flex-none px-4 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
          >
            Trocar
          </button>
          <button 
            onClick={onLogout}
            className="flex-1 md:flex-none px-4 py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95 border border-rose-100"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar size={18} className="md:w-5 md:h-5" />
            </div>
            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês</span>
          </div>
          <h3 className="text-lg md:text-2xl font-black text-slate-800">{monthlyStats.days} Dias</h3>
          <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase mt-1">Trabalhados</p>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Clock size={18} className="md:w-5 md:h-5" />
            </div>
            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Horas</span>
          </div>
          <h3 className="text-lg md:text-2xl font-black text-slate-800">{monthlyStats.hours.toFixed(1)}h</h3>
          <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase mt-1">Total</p>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp size={18} className="md:w-5 md:h-5" />
            </div>
            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Extras</span>
          </div>
          <h3 className="text-lg md:text-2xl font-black text-slate-800">{monthlyStats.extraHours.toFixed(1)}h</h3>
          <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase mt-1">Acumuladas</p>
        </div>

        <div className="bg-[#0b1222] p-4 md:p-6 rounded-3xl shadow-xl shadow-blue-900/10 text-white col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <div className="p-2 bg-blue-600 rounded-xl">
              <DollarSign size={18} className="md:w-5 md:h-5" />
            </div>
            <div className="text-right">
              <span className="text-[8px] md:text-[10px] font-black text-blue-400 uppercase tracking-widest block">A Receber</span>
              {currentCollab && (
                <span className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">
                  Base: R$ {currentCollab.payValue.toLocaleString('pt-BR')} ({currentCollab.payType})
                </span>
              )}
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white">R$ {monthlyStats.totalPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase mt-1">Acumulado até hoje</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 leading-none">
              <Hammer size={24} className="text-blue-600" /> Minhas Tarefas
            </h2>
            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full uppercase tracking-widest">
              {collabStages.length} Ativas
            </span>
          </div>

          <div className="space-y-4">
            {collabStages.length > 0 ? (
              collabStages.map(stage => (
                <div key={stage.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">{stage.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Obra: {stage.workId}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      stage.status === 'Concluído' ? 'bg-emerald-100 text-emerald-600' : 
                      stage.status === 'Em andamento' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {stage.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          stage.status === 'Concluído' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${stage.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{stage.progress}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma tarefa atribuída</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Logs Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 leading-none">
              <History size={24} className="text-slate-400" /> Meus Registros
            </h2>
            <span className="text-[10px] font-black bg-slate-50 text-slate-500 px-4 py-1.5 rounded-full uppercase tracking-widest">Últimos 10</span>
          </div>

          <div className="space-y-3">
            {collabLogs.slice(0, 10).map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${log.type === 'Entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 uppercase text-xs tracking-tight">{log.type}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{log.workName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 tabular-nums">{log.timestamp}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Hoje</p>
                </div>
              </div>
            ))}
            {collabLogs.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum registro de ponto</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-600 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20 flex flex-col md:flex-row items-center gap-4 md:gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl md:blur-3xl"></div>
        <div className="p-3 md:p-4 bg-white/20 rounded-2xl relative z-10">
          <AlertCircle size={24} className="md:w-8 md:h-8" />
        </div>
        <div className="relative z-10 text-center md:text-left">
          <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">Fechamento do Ponto</h3>
          <p className="text-blue-100 text-[10px] md:text-sm mt-1 max-w-xl">
            Lembre-se: o fechamento do ponto ocorre no último dia de cada mês. Verifique seus registros regularmente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortalColaborador;
