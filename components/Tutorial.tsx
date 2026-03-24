
import React, { useState, useEffect } from 'react';
import { Play, Video, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const Tutorial: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const generateVideo = async () => {
    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatusMessage("Iniciando geração do vídeo tutorial...");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = "A high-quality screen recording of a professional construction management dashboard. The camera focuses on a vibrant green WhatsApp icon in the top header. A cursor moves smoothly to the icon, clicks it, and a small confirmation message appears saying 'Redirecionando para o WhatsApp'. The UI is clean, modern, and professional.";

      setStatusMessage("Enviando solicitação para o modelo Veo 3.1...");
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      setStatusMessage("O vídeo está sendo processado. Isso pode levar alguns minutos...");
      
      // Poll for completion
      let attempts = 0;
      while (!operation.done && attempts < 60) { // Max 10 minutes (10s * 60)
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        attempts++;
        setStatusMessage(`Processando vídeo... (${attempts * 10}s decorridos)`);
      }

      if (!operation.done) {
        throw new Error("O tempo limite para a geração do vídeo foi atingido.");
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error("Não foi possível obter o link do vídeo gerado.");
      }

      setStatusMessage("Finalizando download do vídeo...");
      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': process.env.API_KEY || '',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Reset key selection if requested entity not found
          setHasKey(false);
          throw new Error("Erro de autenticação. Por favor, selecione sua chave de API novamente.");
        }
        throw new Error("Falha ao baixar o vídeo gerado.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setStatusMessage("Vídeo gerado com sucesso!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro inesperado ao gerar o vídeo.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-[#0b1222] text-white">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <Video size={24} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Tutorial em Vídeo</h2>
          </div>
          <p className="text-slate-400 font-medium">Veja como utilizar o novo recurso de contato via WhatsApp no topo do sistema.</p>
        </div>

        <div className="p-8">
          {!hasKey ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Chave de API Necessária</h3>
              <p className="text-slate-500 max-w-md mb-8">
                Para gerar vídeos tutoriais personalizados usando inteligência artificial (Veo 3.1), você precisa selecionar uma chave de API válida com faturamento ativado.
              </p>
              <button 
                onClick={handleOpenKeySelector}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-3"
              >
                Selecionar Chave de API
                <ExternalLink size={16} />
              </button>
              <p className="mt-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Consulte a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">documentação de faturamento</a> para mais detalhes.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {!videoUrl && !isGenerating && (
                <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <Play size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 uppercase tracking-tight">Gerar Vídeo Demonstrativo</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mb-8">
                    Clique no botão abaixo para que a IA crie um vídeo mostrando como localizar e usar o ícone do WhatsApp.
                  </p>
                  <button 
                    onClick={generateVideo}
                    className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-3 mx-auto"
                  >
                    Gerar Tutorial Agora
                    <Sparkles size={16} />
                  </button>
                </div>
              )}

              {isGenerating && (
                <div className="bg-slate-900 rounded-3xl p-12 text-center text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-emerald-500 animate-pulse"></div>
                  </div>
                  <div className="relative z-10">
                    <Loader2 size={48} className="animate-spin mx-auto mb-6 text-blue-400" />
                    <h3 className="text-xl font-bold mb-4 uppercase tracking-tight">Criando seu vídeo...</h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-6 font-medium">
                      {statusMessage}
                    </p>
                    <div className="w-full max-w-xs bg-slate-800 h-2 rounded-full mx-auto overflow-hidden">
                      <div className="bg-blue-500 h-full animate-[progress_10s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex gap-4 items-start">
                  <div className="p-2 bg-rose-500 text-white rounded-lg flex-shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-900 uppercase tracking-tight mb-1">Erro na Geração</h4>
                    <p className="text-xs text-rose-700 font-medium">{error}</p>
                    <button 
                      onClick={generateVideo}
                      className="mt-3 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-800 transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              )}

              {videoUrl && (
                <div className="space-y-6">
                  <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200">
                    <video 
                      src={videoUrl} 
                      controls 
                      className="w-full h-full"
                      autoPlay
                    />
                  </div>
                  <div className="flex items-center justify-between p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500 text-white rounded-lg">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-tight">Vídeo Gerado com Sucesso</h4>
                        <p className="text-xs text-emerald-700 font-medium">O tutorial acima demonstra o uso do ícone do WhatsApp.</p>
                      </div>
                    </div>
                    <button 
                      onClick={generateVideo}
                      className="px-4 py-2 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      Gerar Outro
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Passo a Passo
          </h4>
          <ul className="space-y-3">
            {[
              "Localize o ícone verde do WhatsApp no topo direito da tela.",
              "Clique no ícone para abrir uma nova aba.",
              "O sistema redirecionará você para o chat oficial.",
              "Envie sua mensagem diretamente para o suporte."
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-xs text-slate-600 font-medium">
                <span className="text-blue-600 font-black">0{i+1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            Dica de Ouro
          </h4>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Mantenha seu WhatsApp Web conectado no navegador para que o contato seja ainda mais rápido e eficiente. O ícone está disponível em todas as telas do sistema para sua conveniência.
          </p>
        </div>
      </div>
    </div>
  );
};

const Sparkles: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export default Tutorial;
