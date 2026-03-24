
import React, { useState, useEffect } from 'react';
import { 
  Target, 
  FileText, 
  TrendingUp, 
  Users, 
  Clock, 
  ShieldAlert, 
  ChevronRight, 
  Download, 
  Printer, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Construction
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Project } from '../types';
import { generateStrategicPlanning } from '../services/geminiService';

const PlanejamentoEstrategico: React.FC = () => {
  const [works, setWorks] = useState<Project[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedWorks = localStorage.getItem('perfil_works');
    if (savedWorks) {
      setWorks(JSON.parse(savedWorks));
    }
  }, []);

  const handleGenerate = async () => {
    if (!selectedWorkId) return;
    
    const work = works.find(w => w.id === selectedWorkId);
    if (!work) return;

    setLoading(true);
    setError(null);
    setPlanning(null);

    try {
      const result = await generateStrategicPlanning(work);
      if (result) {
        setPlanning(result);
      } else {
        setError("Não foi possível gerar o planejamento. Tente novamente.");
      }
    } catch (err) {
      setError("Ocorreu um erro ao processar sua solicitação.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedWork = works.find(w => w.id === selectedWorkId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#0b1222] text-white rounded-2xl shadow-lg shadow-blue-500/10">
            <Target size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Planejamento Estratégico</h1>
            <p className="text-slate-500 text-xs font-medium">Análise executiva e orçamentação estratégica (Admin Only)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl">
          <ShieldAlert size={16} className="text-amber-600" />
          <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Modo Administrador Ativo</span>
        </div>
      </div>

      {/* Selection Card */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecione a Obra para Análise</label>
            <select 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              value={selectedWorkId}
              onChange={(e) => setSelectedWorkId(e.target.value)}
            >
              <option value="">Escolha um projeto...</option>
              {works.map(work => (
                <option key={work.id} value={work.id}>{work.name} - {work.registrationNumber}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={!selectedWorkId || loading}
            className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg ${
              !selectedWorkId || loading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-[#0b1222] text-white hover:bg-blue-600 active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Processando Projetos...
              </>
            ) : (
              <>
                <Construction size={16} />
                Gerar Planejamento Real
              </>
            )}
          </button>
        </div>

        {!selectedWorkId && (
          <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
            <AlertCircle size={18} className="text-blue-600 mt-0.5" />
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed">
              Selecione uma obra acima para que a IA analise os projetos técnicos, extraia quantitativos e gere o custo real atualizado para 2026.
            </p>
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Target size={32} className="text-blue-600 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Analisando Projetos Técnicos</h3>
            <p className="text-slate-500 text-xs mt-2 max-w-md mx-auto">
              Nossa IA está lendo os arquivos estruturais, arquitetônicos e de fundação para extrair quantitativos reais e aplicar a tabela de preços 2026.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      ) : planning ? (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex justify-end gap-3">
            <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-600 hover:text-blue-600 transition-colors shadow-sm">
              <Printer size={18} />
            </button>
            <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-600 hover:text-blue-600 transition-colors shadow-sm">
              <Download size={18} />
            </button>
          </div>

          {/* Planning Content */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase leading-none">Relatório Executivo Estratégico</h2>
                  <p className="text-blue-400 text-[10px] font-bold uppercase mt-2 tracking-widest">Obra: {selectedWork?.name}</p>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data de Geração</p>
                <p className="text-xs font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="p-8 md:p-12">
              <div className="markdown-body prose prose-slate max-w-none 
                prose-headings:uppercase prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-sm
                prose-strong:text-slate-900 prose-strong:font-black
                prose-ul:list-disc prose-li:text-slate-600 prose-li:text-sm
                prose-table:w-full prose-table:border-collapse prose-th:bg-slate-50 prose-th:p-3 prose-th:text-[10px] prose-th:font-black prose-th:uppercase prose-th:tracking-widest prose-td:p-3 prose-td:text-xs prose-td:border-b prose-td:border-slate-100
              ">
                <Markdown>{planning}</Markdown>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <CheckCircle2 size={18} />
                </div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  Planejamento validado com base na produtividade real de mercado.
                </p>
              </div>
              <button 
                onClick={handleGenerate}
                className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                <RefreshCw size={14} />
                Recalcular Planejamento
              </button>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 p-12 rounded-[2.5rem] border border-rose-100 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-black text-rose-900 uppercase tracking-tight">Erro no Processamento</h3>
          <p className="text-rose-700 text-sm max-w-md mx-auto">{error}</p>
          <button 
            onClick={handleGenerate}
            className="mt-4 px-8 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 p-20 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 text-slate-200">
            <Construction size={48} />
          </div>
          <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Aguardando Seleção</h3>
          <p className="text-slate-400 text-sm mt-2 max-w-xs">
            Selecione uma obra acima para iniciar a análise estratégica e o planejamento executivo.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlanejamentoEstrategico;
