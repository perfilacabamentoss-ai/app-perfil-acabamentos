
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Scan, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  ShieldCheck,
  History,
  Building2,
  MapPin,
  RefreshCcw,
  Fingerprint,
  RotateCcw,
  Loader2,
  Volume2,
  Mic,
  Play,
  Users
} from 'lucide-react';
import { TimeLog, Collaborator } from '../types';
import AudioTranscriber from './AudioTranscriber';

const PontoFacial: React.FC<{ readOnly?: boolean }> = ({ readOnly }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<'idle' | 'detecting' | 'analyzing' | 'verifying' | 'verified' | 'error'>('idle');
  const [logs, setLogs] = useState<TimeLog[]>(() => {
    const saved = localStorage.getItem('perfil_time_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [collaborators] = useState<Collaborator[]>(() => {
    const saved = localStorage.getItem('perfil_collaborators');
    return saved ? JSON.parse(saved) : [];
  });
  const [verifiedUser, setVerifiedUser] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isStartingRef = useRef(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    
    stopCamera();
    setStatus('idle');

    try {
      const constraints = { 
        video: { 
          facingMode: 'user', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        } 
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Erro ao dar play no vídeo:", e));
        };
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setStatus('error');
    } finally {
      isStartingRef.current = false;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || status !== 'idle') return;
    
    setIsScanning(true);
    setStatus('detecting');
    setProgress(0);

    // Etapa 1: Detecção de Face
    const step1 = setInterval(() => {
      setProgress(prev => {
        if (prev >= 30) {
          clearInterval(step1);
          setStatus('analyzing');
          return 30;
        }
        return prev + 2;
      });
    }, 50);

    // Etapa 2: Análise Biométrica
    setTimeout(() => {
      const step2 = setInterval(() => {
        setProgress(prev => {
          if (prev >= 70) {
            clearInterval(step2);
            setStatus('verifying');
            return 70;
          }
          return prev + 2;
        });
      }, 50);
    }, 1000);

    // Etapa 3: Validação Final
    setTimeout(() => {
      const step3 = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(step3);
            completeVerification();
            return 100;
          }
          return prev + 2;
        });
      }, 50);
    }, 2500);
  };

  const completeVerification = () => {
    const context = canvasRef.current?.getContext('2d');
    if (context && videoRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const photoData = canvasRef.current.toDataURL('image/jpeg');

      const mockUser = "Roberto Silva (Mestre de Obras)";
      setVerifiedUser(mockUser);
      
      const newLog: TimeLog = {
        id: Math.random().toString(36).substr(2, 9),
        collaboratorId: '1',
        collaboratorName: mockUser,
        photo: photoData,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        date: new Date().toISOString().split('T')[0],
        type: 'Entrada',
        workName: 'Residencial Horizonte'
      };

      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('perfil_time_logs', JSON.stringify(updatedLogs));
      setStatus('verified');
      setIsScanning(false);

      setTimeout(() => {
        setStatus('idle');
        setVerifiedUser(null);
        setProgress(0);
      }, 4000);
    }
  };

  const getStatusMessage = () => {
    switch(status) {
      case 'detecting': return 'Mapeando Geometria Facial...';
      case 'analyzing': return 'Analisando Pontos de Biometria...';
      case 'verifying': return 'Verificando Banco de Dados...';
      case 'verified': return 'Identidade Confirmada!';
      default: return '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3 leading-none">
            <Fingerprint className="text-blue-600" size={36} /> Ponto Facial
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Tecnologia biométrica de alta precisão</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-2xl border border-slate-100 shadow-sm">
          <Clock className="text-blue-600" size={20} />
          <span className="text-xl font-black text-slate-800 tabular-nums">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Terminal de Reconhecimento e Lista Diária */}
        <div className="lg:col-span-12 bg-[#0b1222] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row border-8 border-slate-800 min-h-[600px]">
          
          {/* Lado Esquerdo: Câmera (50%) */}
          <div className="w-full lg:w-1/2 relative flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden bg-slate-900">
            {/* HUD Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              {/* Scanner Frame */}
              <div className="absolute inset-[20px] border border-blue-500/20 rounded-[1.5rem]">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
                
                {/* Central Reticle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/10 rounded-full flex items-center justify-center">
                  <div className="w-1 h-6 bg-blue-500/40 absolute top-0"></div>
                  <div className="w-1 h-6 bg-blue-500/40 absolute bottom-0"></div>
                  <div className="h-1 w-6 bg-blue-500/40 absolute left-0"></div>
                  <div className="h-1 w-6 bg-blue-500/40 absolute right-0"></div>
                </div>

                {/* Face Mesh Simulation */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <path 
                        d="M30,40 Q50,20 70,40 Q80,60 50,85 Q20,60 30,40" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="0.5" 
                        className="text-blue-400 animate-pulse"
                      />
                      <circle cx="40" cy="45" r="1" className="text-blue-400 fill-current" />
                      <circle cx="60" cy="45" r="1" className="text-blue-400 fill-current" />
                      <path d="M45,65 Q50,70 55,65" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-400" />
                    </svg>
                  </div>
                )}
                
                {/* Scan Line */}
                {isScanning && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-scan"></div>
                )}
              </div>

              {/* Data Readouts */}
              <div className="absolute top-8 left-8 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Sensor: Active</span>
                </div>
                <div className="text-[7px] font-mono text-blue-500/60 uppercase">
                  BIOMETRIC_SCAN_V2.5
                </div>
              </div>
            </div>

            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={`w-full h-full object-cover transition-all duration-700 ${isScanning ? 'brightness-[0.3] grayscale' : 'brightness-100'}`}
            />
            
            <canvas ref={canvasRef} className="hidden" />

            {/* Action & Feedback Area */}
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center z-20 px-8">
              {status === 'idle' && !readOnly && (
                <button 
                  onClick={handleCapture}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-500/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 group"
                >
                  <Scan size={20} className="group-hover:rotate-90 transition-transform duration-500" /> 
                  Iniciar Reconhecimento
                </button>
              )}

              {status === 'idle' && readOnly && (
                <div className="bg-slate-800/80 backdrop-blur-md text-slate-400 px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] border border-slate-700 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-slate-500" />
                  Modo de Visualização
                </div>
              )}

              {(status === 'detecting' || status === 'analyzing' || status === 'verifying') && (
                <div className="w-full max-w-[240px] space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="font-black uppercase tracking-widest text-[8px]">{getStatusMessage()}</span>
                    </div>
                    <span className="text-blue-400 font-mono text-[10px]">{progress}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {status === 'verified' && (
                <div className="bg-emerald-500 text-white px-6 py-5 rounded-2xl flex flex-col items-center gap-2 shadow-2xl shadow-emerald-500/40 animate-in zoom-in duration-500">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={24} />
                    <div>
                      <span className="font-black uppercase tracking-tight text-sm block leading-none">Confirmado</span>
                      <span className="text-emerald-100 text-[9px] font-bold uppercase tracking-widest mt-1 block truncate max-w-[120px]">{verifiedUser}</span>
                    </div>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <button 
                  onClick={startCamera}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-4 rounded-xl flex items-center gap-3 shadow-2xl transition-all hover:scale-105"
                >
                  <AlertCircle size={18} />
                  <span className="font-black uppercase tracking-widest text-[10px]">Reiniciar Sensor</span>
                </button>
              )}
            </div>
          </div>

          {/* Lado Direito: Lista de Colaboradores do Dia (50%) */}
          <div className="w-full lg:w-1/2 flex flex-col bg-slate-900/50 backdrop-blur-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3 leading-none">
                  <UserCheck size={24} className="text-blue-500" /> Presença Diária
                </h2>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-2">Status em tempo real</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">
                  {logs.length} Registros
                </span>
                <span className="text-[8px] font-bold text-slate-500 uppercase mt-1">Hoje, {new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {collaborators.length > 0 ? (
                collaborators.map(collab => {
                  const userLogs = logs.filter(l => l.collaboratorName.includes(collab.name));
                  const lastLog = userLogs[0];
                  
                  return (
                    <div key={collab.id} className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                      lastLog 
                        ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                        : 'bg-white/5 border-white/10 opacity-60'
                    }`}>
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-800 shadow-lg">
                          {collab.photo ? (
                            <img 
                              src={collab.photo} 
                              alt={collab.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                              <UserCheck size={20} />
                            </div>
                          )}
                        </div>
                        {lastLog && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                            <CheckCircle2 size={8} className="text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-white uppercase text-xs truncate tracking-tight">{collab.name}</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{collab.role}</p>
                      </div>

                      <div className="text-right">
                        {lastLog ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Presente</span>
                            <span className="text-[9px] font-mono text-slate-400 mt-0.5">{lastLog.timestamp}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Ausente</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <div className="p-6 bg-white/5 rounded-full mb-4">
                    <Users size={40} className="text-slate-700" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nenhum colaborador cadastrado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Histórico e Notas de Voz (Abaixo ou em Grid) */}
        <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Histórico Recente */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 leading-none">
                <History size={24} className="text-slate-400" /> Log de Atividades
              </h2>
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full uppercase tracking-widest">Histórico Completo</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {logs.length > 0 ? (
                logs.map(log => (
                  <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:bg-white hover:shadow-lg transition-all">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                      <img 
                        src={log.photo} 
                        alt="Face log" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-900 uppercase text-xs truncate tracking-tight">{log.collaboratorName}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Building2 size={10} className="text-blue-500" /> {log.workName}
                        </span>
                        <span className="text-[9px] font-black text-blue-600 uppercase tabular-nums flex items-center gap-1">
                          <Clock size={10} /> {log.timestamp}
                        </span>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest">
                      {log.type}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 py-12">
                  <p className="font-black uppercase tracking-widest text-xs text-slate-400">Sem registros recentes</p>
                </div>
              )}
            </div>
          </div>

          {/* Audio Transcriber Integration */}
          {import.meta.env.VITE_SHOW_VOICE === 'true' ? (
            <AudioTranscriber />
          ) : (
            <div className="bg-gradient-to-br from-[#0b1222] to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                <Volume2 size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-600 rounded-2xl">
                    <Mic size={24} />
                  </div>
                  <h3 className="font-black uppercase tracking-tight text-lg">Notas de Voz</h3>
                </div>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  Utilize comandos de voz para relatar ocorrências ou observações durante o registro de ponto.
                </p>
                <button className="mt-6 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/10 flex items-center justify-center gap-3">
                  <Play size={16} /> Ativar Assistente de Voz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 4s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default PontoFacial;
