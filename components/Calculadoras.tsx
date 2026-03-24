
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  Box, 
  Paintbrush, 
  DollarSign, 
  ChevronRight,
  RotateCcw,
  Info,
  Ruler,
  Users,
  TrendingUp,
  Layers,
  PlayCircle,
  Volume2,
  Loader2,
  X,
  Settings as SettingsIcon,
  Share2,
  Sparkles,
  Search,
  MapPin,
  Briefcase,
  ClipboardList,
  HardHat,
  ArrowRight,
  FileText,
  Download
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Contractor, Project, View } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LAST_UPDATE_TIMESTAMP = 1741680258000;

interface CalculadorasProps {
  onNavigate?: (view: View) => void;
}

const Calculadoras: React.FC<CalculadorasProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'m2' | 'm3' | 'custo' | 'maodeobra' | 'lucro' | 'materiais' | 'analise360' | 'precos' | 'massa' | 'orcamento'>(() => {
    const lastSeen = localStorage.getItem('perfil_calc_last_seen');
    if (!lastSeen || Number(lastSeen) < LAST_UPDATE_TIMESTAMP) {
      localStorage.setItem('perfil_calc_last_seen', String(LAST_UPDATE_TIMESTAMP));
      return 'massa';
    }
    return 'm2';
  });
  const [isPlayingTutorial, setIsPlayingTutorial] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'>('Puck');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-play when videoUrl is ready and modal is open
  useEffect(() => {
    if (videoUrl && showVideoModal && videoRef.current && audioRef.current) {
      const video = videoRef.current;
      const audio = audioRef.current;
      
      video.src = videoUrl;
      video.load();
      
      const playTogether = () => {
        video.play().catch(console.error);
        audio.play().catch(console.error);
      };

      video.oncanplay = playTogether;
      
      audio.onended = () => {
        setIsPlayingTutorial(false);
        video.pause();
      };

      return () => {
        video.oncanplay = null;
        audio.onended = null;
      };
    }
  }, [videoUrl, showVideoModal]);

  const handleShare = async () => {
    const shareData = {
      title: 'Calculadora Avançada - Perfil Acabamentos',
      text: 'Confira as ferramentas de precisão da Perfil Acabamentos!',
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  const voices = [
    { id: 'Puck', name: 'Puck (Padrão)', desc: 'Voz clara e profissional' },
    { id: 'Charon', name: 'Charon', desc: 'Voz profunda e autoritária' },
    { id: 'Kore', name: 'Kore', desc: 'Voz suave e amigável' },
    { id: 'Fenrir', name: 'Fenrir', desc: 'Voz firme e direta' },
    { id: 'Zephyr', name: 'Zephyr', desc: 'Voz dinâmica e energética' },
  ];

  const tutorialScripts = {
    m2: "Para calcular a área em metros quadrados, insira o comprimento e a largura do espaço. O sistema multiplicará os dois valores automaticamente para você.",
    m3: "O cálculo de volume em metros cúbicos requer comprimento, largura e altura. É a ferramenta ideal para calcular volume de concreto ou aterro.",
    materiais: "Nesta aba, você calcula a quantidade de tijolos para uma parede. Informe a área total e as dimensões do tijolo. O sistema já inclui dez por cento de margem para perdas.",
    custo: "Aqui você soma materiais, mão de obra e outros custos para ter o orçamento total e transparente da sua obra.",
    maodeobra: "Calcule o custo da sua equipe informando os dias de trabalho, o número de pessoas e o valor da diária combinada.",
    lucro: "Informe o custo total e a margem de lucro desejada para descobrir o preço final de venda sugerido para o seu serviço.",
    analise360: "Esta é a nossa IA de Engenharia 360. Ela analisa o custo estratégico considerando juros sobre o financiamento da mão de obra e gera um score de risco para o seu projeto.",
    precos: "Confira a nossa tabela de preços estimados para serviços de pedreiro em 2026. Use estes valores como referência para maior segurança nos seus orçamentos.",
    massa: "Calcule o rendimento da massa para assentamento, reboco ou contrapiso com traço de três para um. Informe a área e a espessura para saber a quantidade de cimento e areia necessária.",
    orcamento: "Gere orçamentos profissionais em PDF para seus clientes. Utilize nossos modelos pré-definidos para agilizar o fechamento de novos negócios."
  };

  const videoPrompts = {
    m2: "A professional architect measuring a large floor area with a laser meter in a modern construction site, high quality, cinematic lighting, 4k",
    m3: "A concrete mixer truck pouring fresh concrete into a foundation at a construction site, drone shot, cinematic, 4k",
    materiais: "A close-up of a mason building a perfect brick wall with red bricks and mortar, sunlight hitting the wall, professional construction, 4k",
    custo: "A clean office desk with blueprints, a calculator, and a high-end pen, representing professional financial planning for construction, cinematic",
    maodeobra: "A team of construction workers in safety gear working together on a building structure, teamwork, professional environment, 4k",
    lucro: "A successful modern house finished with high-end materials, representing the final result of a profitable construction project, cinematic",
    analise360: "A futuristic digital dashboard showing financial charts, construction blueprints, and a glowing green shield representing low risk and high profit, cinematic 4k",
    precos: "A professional construction contract document with price tables and a golden seal of quality, cinematic lighting, 4k",
    massa: "A close-up of fresh mortar being mixed in a professional mixer, perfect texture, construction site background, cinematic lighting, 4k",
    orcamento: "A professional construction contract with a golden seal, lying on a wooden table next to a set of keys and a blueprint, cinematic, 4k"
  };

  const generateTutorial = async () => {
    // Check for API Key first for Video
    if (!(await (window as any).aistudio.hasSelectedApiKey())) {
      await (window as any).aistudio.openSelectKey();
      return;
    }

    setIsGeneratingAudio(true);
    setIsGeneratingVideo(true);
    setShowVideoModal(true);
    setVideoUrl(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const script = tutorialScripts[activeTab];
      const videoPrompt = videoPrompts[activeTab];
      
      // 1. Generate Audio
      const audioPromise = ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Diga de forma profissional e clara: ${script}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      // 2. Generate Video (Veo)
      const videoPromise = (async () => {
        let operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: videoPrompt,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
          }
        });

        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
          const videoRes = await fetch(downloadLink, {
            method: 'GET',
            headers: {
              'x-goog-api-key': (process.env as any).API_KEY || '',
            },
          });
          const blob = await videoRes.blob();
          return URL.createObjectURL(blob);
        }
        return null;
      })();

      const [audioResponse, generatedVideoUrl] = await Promise.all([audioPromise, videoPromise]);

      const base64Audio = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio && generatedVideoUrl) {
        const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
        audioRef.current = new Audio(audioSrc);
        
        setVideoUrl(generatedVideoUrl);
        setIsGeneratingVideo(false);
        setIsGeneratingAudio(false);
        setIsPlayingTutorial(true);
      }
    } catch (error) {
      console.error("Erro ao gerar tutorial completo:", error);
      setIsPlayingTutorial(false);
      setIsGeneratingVideo(false);
      setIsGeneratingAudio(false);
      
      // If error is related to API key, reset
      if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        await (window as any).aistudio.openSelectKey();
      }
    }
  };

  // m2 Calculator State
  const [m2, setM2] = useState({ length: '', width: '' });
  const m2Result = (Number(m2.length) * Number(m2.width)).toFixed(2);

  // m3 Calculator State
  const [m3, setM3] = useState({ length: '', width: '', height: '' });
  const m3Result = (Number(m3.length) * Number(m3.width) * Number(m3.height)).toFixed(2);

  // Custo Total Calculator State
  const [custo, setCusto] = useState({ materiais: '', maodeobra: '', outros: '' });
  const custoResult = (Number(custo.materiais) + Number(custo.maodeobra) + Number(custo.outros)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Mão de Obra Calculator State
  const [maoDeObra, setMaoDeObra] = useState({ dias: '', pessoas: '', diaria: '' });
  const maoDeObraResult = (Number(maoDeObra.dias) * Number(maoDeObra.pessoas) * Number(maoDeObra.diaria)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Margem de Lucro Calculator State
  const [lucro, setLucro] = useState({ custoTotal: '', margem: '' });
  
  // Standard Profit Margin Formula: Price = Cost / (1 - Margin%)
  const marginPercent = Number(lucro.margem) / 100;
  const precoSugerido = marginPercent < 1 ? Number(lucro.custoTotal) / (1 - marginPercent) : 0;
  const lucroBrutoValor = precoSugerido - Number(lucro.custoTotal);
  
  const lucroResult = precoSugerido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const markupResult = (Number(lucro.custoTotal) * (1 + marginPercent)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Materiais (Alvenaria) State
  const [mat, setMat] = useState({ area: '', tijoloComprimento: '0.19', tijoloAltura: '0.19', argamassaEspessura: '0.02' });
  const areaTijolo = (Number(mat.tijoloComprimento) + Number(mat.argamassaEspessura)) * (Number(mat.tijoloAltura) + Number(mat.argamassaEspessura));
  
  // Kitchen Budget State
  const [kitchenBudget, setKitchenBudget] = useState({
    length: '4.60',
    width: '3.40',
    pisoPrice: '50.00',
    paredeArea: '26.10', // 33.06 - 6.96
    paredePrice: '50.00'
  });

  const generateKitchenPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.text("ORÇAMENTO DE REFORMA – COZINHA", pageWidth / 2, 20, { align: 'center' });
    
    // Measures
    doc.setFontSize(12);
    doc.text(`Medidas do ambiente:`, 14, 35);
    doc.text(`Comprimento: ${kitchenBudget.length} m`, 14, 42);
    doc.text(`Largura: ${kitchenBudget.width} m`, 14, 49);
    
    // Table Data
    const pisoArea = Number(kitchenBudget.length) * Number(kitchenBudget.width);
    const pisoTotal = pisoArea * Number(kitchenBudget.pisoPrice);
    const paredeTotal = Number(kitchenBudget.paredeArea) * Number(kitchenBudget.paredePrice);
    const totalGeral = pisoTotal + paredeTotal;

    const tableData = [
      ["Piso", `${kitchenBudget.width} x ${kitchenBudget.length}`, `${pisoArea.toFixed(2)} m²`, kitchenBudget.pisoPrice, pisoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      ["Paredes", "Área informada", `${Number(kitchenBudget.paredeArea).toFixed(2)} m²`, kitchenBudget.paredePrice, paredeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      [{ content: "TOTAL", colSpan: 4, styles: { halign: 'right' as const, fontStyle: 'bold' as const } }, totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })]
    ];

    autoTable(doc, {
      startY: 60,
      head: [["Item", "Cálculo", "Resultado", "Valor m²", "Total (R$)"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: 20, fontStyle: 'bold' },
      styles: { fontSize: 10 },
    });

    doc.save("orcamento_cozinha_reforma.pdf");
  };
  const qtdTijolos = areaTijolo > 0 ? Math.ceil(Number(mat.area) / areaTijolo) : 0;
  const qtdTijolosComPerda = Math.ceil(qtdTijolos * 1.1); // 10% perda

  // Massa (Assentamento/Reboco/Contrapiso) State
  const [massa, setMassa] = useState({ area: '', thickness: '', type: 'reboco' as 'assentamento' | 'reboco' | 'contrapiso' });
  
  const calcMassa = useMemo(() => {
    const area = Number(massa.area);
    const thicknessCm = Number(massa.thickness);
    if (!area || !thicknessCm) return null;

    const volumeM3 = area * (thicknessCm / 100);
    
    // Traço 3:1 (Areia:Cimento)
    // Consumo aproximado por m3 de argamassa 3:1:
    // Cimento: ~450kg (9 sacos de 50kg)
    // Areia: ~1.1 m3
    
    const cimentoKg = volumeM3 * 450;
    const sacosCimento = Math.ceil(cimentoKg / 50);
    const areiaM3 = volumeM3 * 1.1;

    return { volumeM3, cimentoKg, sacosCimento, areiaM3 };
  }, [massa]);

  // IA Engenharia 360 State
  const [analise360, setAnalise360] = useState({ 
    materiais: '', 
    maoObra: '', 
    juros: '', 
    meses: '', 
    valorVenda: '',
    areaObra: '',
    servico: '',
    empreiteiro: ''
  });

  // Lists for filters
  const contractorsList = useMemo<Contractor[]>(() => {
    const saved = localStorage.getItem('perfil_contractors');
    return saved ? JSON.parse(saved) : [];
  }, []);

  const worksList = useMemo<Project[]>(() => {
    const saved = localStorage.getItem('perfil_works');
    return saved ? JSON.parse(saved) : [];
  }, []);

  const servicesList = useMemo(() => {
    const services = contractorsList.map(c => c.service);
    return Array.from(new Set(services)).filter(Boolean);
  }, [contractorsList]);

  const [showContractorList, setShowContractorList] = useState(false);
  const [showServiceList, setShowServiceList] = useState(false);
  const [showWorkAreaList, setShowWorkAreaList] = useState(false);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowContractorList(false);
      setShowServiceList(false);
      setShowWorkAreaList(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredContractors = useMemo(() => {
    return contractorsList.filter(c => 
      c.name.toLowerCase().includes(analise360.empreiteiro.toLowerCase())
    );
  }, [contractorsList, analise360.empreiteiro]);

  const filteredServices = useMemo(() => {
    return servicesList.filter(s => 
      s.toLowerCase().includes(analise360.servico.toLowerCase())
    );
  }, [servicesList, analise360.servico]);

  const filteredWorks = useMemo(() => {
    return worksList.filter(w => 
      w.name.toLowerCase().includes(analise360.areaObra.toLowerCase())
    );
  }, [worksList, analise360.areaObra]);
  
  const calc360 = useMemo(() => {
    const m = Number(analise360.materiais);
    const mo = Number(analise360.maoObra);
    const j = Number(analise360.juros);
    const meses = Number(analise360.meses);
    const venda = Number(analise360.valorVenda);

    if (!m || !mo || !venda) return null;

    const materiais10 = m * 0.10;
    const financiamento = mo * Math.pow((1 + j), meses);
    const custo = materiais10 + financiamento;
    const lucro = venda - custo;
    const margem = venda > 0 ? (lucro / venda) * 100 : 0;

    let score = 0;
    if(margem > 30) score = 90;
    else if(margem > 20) score = 75;
    else if(margem > 10) score = 55;
    else score = 30;

    const risco = margem > 25 ? { label: "Baixo Risco", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: "🟢" } :
                 margem > 15 ? { label: "Médio Risco", color: "text-amber-500", bg: "bg-amber-500/10", icon: "🟡" } :
                 { label: "Alto Risco", color: "text-rose-500", bg: "bg-rose-500/10", icon: "🔴" };

    return { custo, lucro, margem, score, risco };
  }, [analise360]);

  const reset = () => {
    if (activeTab === 'm2') setM2({ length: '', width: '' });
    if (activeTab === 'm3') setM3({ length: '', width: '', height: '' });
    if (activeTab === 'custo') setCusto({ materiais: '', maodeobra: '', outros: '' });
    if (activeTab === 'maodeobra') setMaoDeObra({ dias: '', pessoas: '', diaria: '' });
    if (activeTab === 'lucro') setLucro({ custoTotal: '', margem: '' });
    if (activeTab === 'materiais') setMat({ area: '', tijoloComprimento: '0.19', tijoloAltura: '0.19', argamassaEspessura: '0.02' });
    if (activeTab === 'analise360') setAnalise360({ materiais: '', maoObra: '', juros: '', meses: '', valorVenda: '', areaObra: '', servico: '', empreiteiro: '' });
    if (activeTab === 'massa') setMassa({ area: '', thickness: '', type: 'reboco' });
    if (activeTab === 'orcamento') setKitchenBudget({ length: '4.60', width: '3.40', pisoPrice: '50.00', paredeArea: '26.10', paredePrice: '50.00' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Calculadora Avançada</h1>
            <p className="text-slate-500 mt-2 font-medium">Ferramentas de precisão para engenharia e gestão de custos</p>
          </div>
          <div className="relative">
            <button 
              onClick={generateTutorial}
              disabled={isPlayingTutorial}
              className={`p-3 rounded-2xl transition-all flex items-center gap-2 group ${isPlayingTutorial ? 'bg-blue-100 text-blue-600' : 'bg-white border border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600 shadow-sm'}`}
              title="Ver Vídeo Tutorial"
            >
              {isGeneratingAudio || isGeneratingVideo ? (
                <Loader2 size={24} className="animate-spin" />
              ) : isPlayingTutorial ? (
                <Volume2 size={24} className="animate-bounce" />
              ) : (
                <PlayCircle size={24} className="group-hover:scale-110 transition-transform" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Vídeo Tutorial</span>
            </button>
            
            <button 
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="absolute -top-2 -right-2 p-1.5 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-blue-600 shadow-sm z-10"
              title="Configurar Voz"
            >
              <SettingsIcon size={12} />
            </button>

            {showVoiceSettings && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escolher Voz</h3>
                  <button onClick={() => setShowVoiceSettings(false)} className="text-slate-400 hover:text-rose-500">
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {voices.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => {
                        setSelectedVoice(voice.id as any);
                        setShowVoiceSettings(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all border ${selectedVoice === voice.id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'}`}
                    >
                      <div className="text-[10px] font-black uppercase tracking-tight">{voice.name}</div>
                      <div className="text-[9px] opacity-70">{voice.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleShare}
            className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all"
            title="Compartilhar Calculadora"
          >
            <Share2 size={24} />
          </button>
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
            Modo Pro Ativo
          </div>
        </div>
      </div>

      {/* Video Tutorial Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative border border-white/10">
            <button 
              onClick={() => {
                setShowVideoModal(false);
                setIsPlayingTutorial(false);
                if (videoRef.current) videoRef.current.pause();
                if (audioRef.current) audioRef.current.pause();
              }}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-rose-600 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="aspect-video bg-black flex items-center justify-center relative">
              {isGeneratingVideo ? (
                <div className="flex flex-col items-center gap-4 text-center p-8">
                  <div className="relative">
                    <Loader2 size={64} className="text-blue-500 animate-spin" />
                    <PlayCircle size={32} className="absolute inset-0 m-auto text-blue-400/50" />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-widest text-lg">Gerando Vídeo Tutorial</h3>
                    <p className="text-slate-400 text-sm mt-2 max-w-xs">Nossa IA está criando uma cena cinematográfica personalizada para este cálculo. Por favor, aguarde...</p>
                  </div>
                </div>
              ) : (
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  controls={false}
                  autoPlay
                  playsInline
                />
              )}
              
              {/* Overlay with Script */}
              {!isGeneratingVideo && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-3 text-blue-400 mb-2">
                    <Volume2 size={16} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Narração Ativa: {voices.find(v => v.id === selectedVoice)?.name}</span>
                  </div>
                  <p className="text-white text-sm font-medium leading-relaxed italic">
                    "{tutorialScripts[activeTab]}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('m2')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'm2' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
          >
            <div className="flex items-center gap-3">
              <Ruler size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Calcular m²</span>
            </div>
            <ChevronRight size={16} className={activeTab === 'm2' ? 'opacity-100' : 'opacity-0'} />
          </button>

          <button 
            onClick={() => setActiveTab('m3')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'm3' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
          >
            <div className="flex items-center gap-3">
              <Box size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Calcular m³</span>
            </div>
            <ChevronRight size={16} className={activeTab === 'm3' ? 'opacity-100' : 'opacity-0'} />
          </button>

          <button 
            onClick={() => setActiveTab('materiais')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'materiais' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
          >
            <div className="flex items-center gap-3">
              <Layers size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Consumo Materiais</span>
            </div>
            <ChevronRight size={16} className={activeTab === 'materiais' ? 'opacity-100' : 'opacity-0'} />
          </button>

          <button 
            onClick={() => setActiveTab('massa')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'massa' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
          >
            <div className="flex items-center gap-3">
              <Paintbrush size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Rendimento Massa (3x1)</span>
            </div>
            <ChevronRight size={16} className={activeTab === 'massa' ? 'opacity-100' : 'opacity-0'} />
          </button>

          <button 
            onClick={() => setActiveTab('custo')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'custo' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
          >
            <div className="flex items-center gap-3">
              <DollarSign size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Custo da Obra</span>
            </div>
            <ChevronRight size={16} className={activeTab === 'custo' ? 'opacity-100' : 'opacity-0'} />
          </button>

          <button 
            onClick={() => setActiveTab('maodeobra')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'maodeobra' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
          >
            <div className="flex items-center gap-3">
              <Users size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Mão de Obra</span>
            </div>
            <ChevronRight size={16} className={activeTab === 'maodeobra' ? 'opacity-100' : 'opacity-0'} />
          </button>

          <button 
            onClick={() => setActiveTab('lucro')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'lucro' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
          >
            <div className="flex items-center gap-3">
              <TrendingUp size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Margem de Lucro</span>
            </div>
            <ChevronRight size={16} className={activeTab === 'lucro' ? 'opacity-100' : 'opacity-0'} />
          </button>

          <button 
            onClick={() => setActiveTab('precos')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'precos' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
          >
            <div className="flex items-center gap-3">
              <ClipboardList size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Preços 2026</span>
            </div>
            <ChevronRight size={16} className={activeTab === 'precos' ? 'opacity-100' : 'opacity-0'} />
          </button>

          <button 
            onClick={() => setActiveTab('orcamento')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'orcamento' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
          >
            <div className="flex items-center gap-3">
              <FileText size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Orçamentos PDF</span>
            </div>
            <ChevronRight size={16} className={activeTab === 'orcamento' ? 'opacity-100' : 'opacity-0'} />
          </button>

          <button 
            onClick={() => setActiveTab('analise360')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'analise360' ? 'bg-[#0b1222] text-blue-400 border-[#0b1222] shadow-lg shadow-blue-900/20' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
          >
            <div className="flex items-center gap-3">
              <Sparkles size={20} className={activeTab === 'analise360' ? 'animate-pulse' : ''} />
              <span className="text-xs font-black uppercase tracking-widest">Engenharia 360°</span>
            </div>
            <ChevronRight size={16} className={activeTab === 'analise360' ? 'opacity-100' : 'opacity-0'} />
          </button>
        </div>

        {/* Calculator Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[550px] flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  {activeTab === 'm2' && <Ruler size={24} />}
                  {activeTab === 'm3' && <Box size={24} />}
                  {activeTab === 'materiais' && <Layers size={24} />}
                  {activeTab === 'massa' && <Paintbrush size={24} />}
                  {activeTab === 'custo' && <DollarSign size={24} />}
                  {activeTab === 'maodeobra' && <Users size={24} />}
                  {activeTab === 'lucro' && <TrendingUp size={24} />}
                  {activeTab === 'precos' && <ClipboardList size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {activeTab === 'm2' && 'Cálculo de Área (m²)'}
                    {activeTab === 'm3' && 'Cálculo de Volume (m³)'}
                    {activeTab === 'materiais' && 'Consumo de Materiais (Alvenaria)'}
                    {activeTab === 'massa' && 'Rendimento de Massa (Traço 3x1)'}
                    {activeTab === 'custo' && 'Custo Total da Obra'}
                    {activeTab === 'maodeobra' && 'Cálculo de Mão de Obra'}
                    {activeTab === 'lucro' && 'Cálculo de Margem de Lucro'}
                    {activeTab === 'precos' && 'Tabela de Preços Estimados 2026'}
                    {activeTab === 'analise360' && 'IA Engenharia 360°'}
                    {activeTab === 'orcamento' && 'Gerador de Orçamentos PDF'}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Insira os valores técnicos abaixo</p>
                </div>
              </div>
              <button 
                onClick={reset}
                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group"
                title="Limpar campos"
              >
                <RotateCcw size={20} className="group-hover:rotate-[-45deg] transition-transform" />
              </button>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              {activeTab === 'analise360' && (
                <div className="mb-8 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Filtro de Empreiteiro */}
                    <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empreiteiro</label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          value={analise360.empreiteiro}
                          onChange={(e) => {
                            setAnalise360({...analise360, empreiteiro: e.target.value});
                            setShowContractorList(true);
                          }}
                          onFocus={(e) => {
                            e.stopPropagation();
                            setShowContractorList(true);
                          }}
                          placeholder="Buscar empreiteiro..."
                          className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        />
                      </div>
                      {showContractorList && filteredContractors.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                          {filteredContractors.map(c => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setAnalise360({...analise360, empreiteiro: c.name, servico: c.service, areaObra: c.currentWork});
                                setShowContractorList(false);
                              }}
                              className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 border-b border-slate-50 last:border-0 transition-colors"
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Filtro de Serviço */}
                    <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Serviço</label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          value={analise360.servico}
                          onChange={(e) => {
                            setAnalise360({...analise360, servico: e.target.value});
                            setShowServiceList(true);
                          }}
                          onFocus={(e) => {
                            e.stopPropagation();
                            setShowServiceList(true);
                          }}
                          placeholder="Qual o serviço?"
                          className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        />
                      </div>
                      {showServiceList && filteredServices.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                          {filteredServices.map(s => (
                            <button
                              key={s}
                              onClick={() => {
                                setAnalise360({...analise360, servico: s});
                                setShowServiceList(false);
                              }}
                              className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 border-b border-slate-50 last:border-0 transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Filtro de Área da Obra */}
                    <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Área da Obra</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          value={analise360.areaObra}
                          onChange={(e) => {
                            setAnalise360({...analise360, areaObra: e.target.value});
                            setShowWorkAreaList(true);
                          }}
                          onFocus={(e) => {
                            e.stopPropagation();
                            setShowWorkAreaList(true);
                          }}
                          placeholder="Qual área?"
                          className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        />
                      </div>
                      {showWorkAreaList && filteredWorks.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                          {filteredWorks.map(w => (
                            <button
                              key={w.id}
                              onClick={() => {
                                setAnalise360({...analise360, areaObra: w.name});
                                setShowWorkAreaList(false);
                              }}
                              className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 border-b border-slate-50 last:border-0 transition-colors"
                            >
                              {w.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                {/* Inputs */}
                <div className="space-y-6">
                  {activeTab === 'orcamento' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                      <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 mb-6">
                        <div className="flex items-center gap-3 text-blue-600 mb-2">
                          <Info size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Modelo: Reforma de Cozinha</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">Este modelo gera um orçamento detalhado para reforma de cozinha, incluindo piso e paredes.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comprimento (m)</label>
                          <input 
                            type="number" 
                            value={kitchenBudget.length}
                            onChange={(e) => setKitchenBudget({...kitchenBudget, length: e.target.value})}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Largura (m)</label>
                          <input 
                            type="number" 
                            value={kitchenBudget.width}
                            onChange={(e) => setKitchenBudget({...kitchenBudget, width: e.target.value})}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor m² Piso (R$)</label>
                        <input 
                          type="number" 
                          value={kitchenBudget.pisoPrice}
                          onChange={(e) => setKitchenBudget({...kitchenBudget, pisoPrice: e.target.value})}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Área Paredes (m²)</label>
                          <input 
                            type="number" 
                            value={kitchenBudget.paredeArea}
                            onChange={(e) => setKitchenBudget({...kitchenBudget, paredeArea: e.target.value})}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor m² Parede (R$)</label>
                          <input 
                            type="number" 
                            value={kitchenBudget.paredePrice}
                            onChange={(e) => setKitchenBudget({...kitchenBudget, paredePrice: e.target.value})}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={generateKitchenPDF}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 transition-all group"
                      >
                        <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                        Gerar Orçamento PDF
                      </button>
                    </div>
                  )}

                  {activeTab === 'm2' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comprimento (m)</label>
                        <input 
                          type="number" 
                          value={m2.length}
                          onChange={(e) => setM2({...m2, length: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Largura (m)</label>
                        <input 
                          type="number" 
                          value={m2.width}
                          onChange={(e) => setM2({...m2, width: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'm3' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comprimento (m)</label>
                        <input 
                          type="number" 
                          value={m3.length}
                          onChange={(e) => setM3({...m3, length: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Largura (m)</label>
                        <input 
                          type="number" 
                          value={m3.width}
                          onChange={(e) => setM3({...m3, width: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Altura (m)</label>
                        <input 
                          type="number" 
                          value={m3.height}
                          onChange={(e) => setM3({...m3, height: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'materiais' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Área da Parede (m²)</label>
                        <input 
                          type="number" 
                          value={mat.area}
                          onChange={(e) => setMat({...mat, area: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comp. Tijolo (m)</label>
                          <input 
                            type="number" 
                            value={mat.tijoloComprimento}
                            onChange={(e) => setMat({...mat, tijoloComprimento: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alt. Tijolo (m)</label>
                          <input 
                            type="number" 
                            value={mat.tijoloAltura}
                            onChange={(e) => setMat({...mat, tijoloAltura: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'massa' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Aplicação</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['assentamento', 'reboco', 'contrapiso'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => setMassa({...massa, type})}
                              className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${massa.type === type ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Área Total (m²)</label>
                        <input 
                          type="number" 
                          value={massa.area}
                          onChange={(e) => setMassa({...massa, area: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Espessura da Massa (cm)</label>
                        <input 
                          type="number" 
                          value={massa.thickness}
                          onChange={(e) => setMassa({...massa, thickness: e.target.value})}
                          placeholder="Ex: 2.5"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                        <Info size={16} className="text-amber-600 mt-0.5" />
                        <p className="text-[9px] font-bold text-amber-800 uppercase tracking-widest leading-relaxed">
                          Cálculo baseado no traço 3x1 (3 partes de areia para 1 de cimento). Ideal para assentamento, reboco e contrapiso de alta resistência.
                        </p>
                      </div>
                    </>
                  )}

                  {activeTab === 'custo' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Materiais (R$)</label>
                        <input 
                          type="number" 
                          value={custo.materiais}
                          onChange={(e) => setCusto({...custo, materiais: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mão de Obra (R$)</label>
                        <input 
                          type="number" 
                          value={custo.maodeobra}
                          onChange={(e) => setCusto({...custo, maodeobra: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Outros Custos (R$)</label>
                        <input 
                          type="number" 
                          value={custo.outros}
                          onChange={(e) => setCusto({...custo, outros: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'maodeobra' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dias de Trabalho</label>
                        <input 
                          type="number" 
                          value={maoDeObra.dias}
                          onChange={(e) => setMaoDeObra({...maoDeObra, dias: e.target.value})}
                          placeholder="0"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nº de Pessoas</label>
                        <input 
                          type="number" 
                          value={maoDeObra.pessoas}
                          onChange={(e) => setMaoDeObra({...maoDeObra, pessoas: e.target.value})}
                          placeholder="0"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor da Diária (R$)</label>
                        <input 
                          type="number" 
                          value={maoDeObra.diaria}
                          onChange={(e) => setMaoDeObra({...maoDeObra, diaria: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'lucro' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custo Total (R$)</label>
                        <input 
                          type="number" 
                          value={lucro.custoTotal}
                          onChange={(e) => setLucro({...lucro, custoTotal: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Margem Desejada (%)</label>
                        <input 
                          type="number" 
                          value={lucro.margem}
                          onChange={(e) => setLucro({...lucro, margem: e.target.value})}
                          placeholder="0"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'precos' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                        <Info size={18} className="text-blue-600 mt-0.5" />
                        <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed">
                          Valores médios de mercado para 2026. Use como referência estratégica para orçamentos e contratações de mão de obra.
                        </p>
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-white">
                              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Serviço (Pedreiro)</th>
                              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Unidade</th>
                              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Preço Médio (2026)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[
                              { s: 'Diária Oficial/Pedreiro', u: 'Dia (8h)', p: 'R$ 180,00 – R$ 380,00' },
                              { s: 'Diária Ajudante/Servente', u: 'Dia (8h)', p: 'R$ 120,00 – R$ 200,00' },
                              { s: 'Alvenaria (Paredes)', u: 'm²', p: 'R$ 90,00 – R$ 150,00' },
                              { s: 'Assentamento Porcelanato', u: 'm²', p: 'R$ 60,00 – R$ 100,00' },
                              { s: 'Reboco Interno', u: 'm²', p: 'R$ 35,00 – R$ 60,00' },
                              { s: 'Reboco Externo/Fachada', u: 'm²', p: 'R$ 45,00 – R$ 75,00' },
                              { s: 'Chapisco + Reboco', u: 'm²', p: 'R$ 55,00 – R$ 90,00' },
                              { s: 'Piso Cerâmico', u: 'm²', p: 'R$ 40,00 – R$ 70,00' },
                              { s: 'Chapiscagem', u: 'm²', p: 'R$ 20,00 – R$ 30,00' },
                            ].map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-4 py-3 text-xs font-bold text-slate-700 group-hover:text-blue-600">{row.s}</td>
                                <td className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.u}</td>
                                <td className="px-4 py-3 text-xs font-black text-slate-900">{row.p}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'analise360' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Materiais (R$)</label>
                          <input 
                            type="number" 
                            value={analise360.materiais}
                            onChange={(e) => setAnalise360({...analise360, materiais: e.target.value})}
                            placeholder="0.00"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mão de Obra (R$)</label>
                          <input 
                            type="number" 
                            value={analise360.maoObra}
                            onChange={(e) => setAnalise360({...analise360, maoObra: e.target.value})}
                            placeholder="0.00"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Juros Mensal (ex: 0.02)</label>
                          <input 
                            type="number" 
                            value={analise360.juros}
                            onChange={(e) => setAnalise360({...analise360, juros: e.target.value})}
                            placeholder="0.00"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Prazo (Meses)</label>
                          <input 
                            type="number" 
                            value={analise360.meses}
                            onChange={(e) => setAnalise360({...analise360, meses: e.target.value})}
                            placeholder="0"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor de Venda (R$)</label>
                        <input 
                          type="number" 
                          value={analise360.valorVenda}
                          onChange={(e) => setAnalise360({...analise360, valorVenda: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Result Display */}
                <div className={`rounded-[2rem] p-8 text-white flex flex-col justify-center items-center text-center relative overflow-hidden transition-colors duration-500 ${activeTab === 'analise360' ? 'bg-[#0b1222]' : 'bg-slate-900'}`}>
                  <div className={`absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[80px] ${activeTab === 'analise360' ? 'bg-blue-500/10' : 'bg-blue-600/20'}`}></div>
                  
                  <div className="relative z-10 w-full">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-4">
                      {activeTab === 'analise360' ? 'Análise Financeira 360°' : activeTab === 'precos' ? 'Referência de Mercado' : 'Resultado Estimado'}
                    </p>
                    
                    {activeTab === 'precos' && (
                      <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                          <Sparkles size={40} className="mx-auto mb-4 text-blue-400" />
                          <h3 className="text-xl font-black tracking-tight mb-2">Segurança Orçamentária</h3>
                          <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-wider">
                            Estes valores são baseados em projeções de custos de insumos e mão de obra para o ano de 2026.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[8px] uppercase tracking-widest text-slate-400">Variação Média</p>
                            <p className="text-lg font-black text-blue-400">± 15%</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[8px] uppercase tracking-widest text-slate-400">Base Regional</p>
                            <p className="text-lg font-black text-blue-400">Brasil</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'analise360' && calc360 ? (
                      <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[8px] uppercase tracking-widest text-slate-400">Custo Estratégico</p>
                            <p className="text-sm font-black">R$ {calc360.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[8px] uppercase tracking-widest text-slate-400">Lucro Projetado</p>
                            <p className="text-sm font-black text-emerald-400">R$ {calc360.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                              <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                              <circle 
                                cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" 
                                strokeDasharray={364}
                                strokeDashoffset={364 - (364 * calc360.score) / 100}
                                className="text-blue-500 transition-all duration-1000"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-black">{calc360.score}</span>
                              <span className="text-[8px] font-bold uppercase text-slate-400">Score IA</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${calc360.risco.bg} ${calc360.risco.color}`}>
                            <span>{calc360.risco.icon}</span>
                            <span>Classificação: {calc360.risco.label}</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Margem Real: {calc360.margem.toFixed(2)}%</p>
                        </div>
                      </div>
                    ) : activeTab === 'analise360' ? (
                      <div className="py-12 opacity-30">
                        <Sparkles size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Aguardando dados para análise...</p>
                      </div>
                    ) : activeTab === 'orcamento' ? (
                      <div className="space-y-6 animate-in fade-in zoom-in duration-500 w-full">
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                          <p className="text-[8px] uppercase tracking-widest text-slate-400 mb-1">Total Estimado</p>
                          <h3 className="text-4xl font-black tracking-tight text-emerald-400">
                            R$ {(
                              (Number(kitchenBudget.length) * Number(kitchenBudget.width) * Number(kitchenBudget.pisoPrice)) + 
                              (Number(kitchenBudget.paredeArea) * Number(kitchenBudget.paredePrice))
                            ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </h3>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                            <div className="text-left">
                              <p className="text-[8px] uppercase tracking-widest text-slate-400">Piso</p>
                              <p className="text-sm font-bold text-white">{(Number(kitchenBudget.length) * Number(kitchenBudget.width)).toFixed(2)} m²</p>
                            </div>
                            <p className="text-xs font-black text-slate-300">R$ {(Number(kitchenBudget.length) * Number(kitchenBudget.width) * Number(kitchenBudget.pisoPrice)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                            <div className="text-left">
                              <p className="text-[8px] uppercase tracking-widest text-slate-400">Paredes</p>
                              <p className="text-sm font-bold text-white">{Number(kitchenBudget.paredeArea).toFixed(2)} m²</p>
                            </div>
                            <p className="text-xs font-black text-slate-300">R$ {(Number(kitchenBudget.paredeArea) * Number(kitchenBudget.paredePrice)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-emerald-600/20 rounded-2xl border border-emerald-500/30">
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300">Pronto para Exportar</p>
                          <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                            Clique no botão ao lado para gerar o arquivo PDF profissional com sua logo e dados detalhados.
                          </p>
                        </div>
                      </div>
                    ) : activeTab === 'massa' && calcMassa ? (
                      <div className="space-y-6 animate-in fade-in zoom-in duration-500 w-full">
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                          <p className="text-[8px] uppercase tracking-widest text-slate-400 mb-1">Volume de Argamassa</p>
                          <h3 className="text-4xl font-black tracking-tight text-blue-400">{calcMassa.volumeM3.toFixed(3)} m³</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                            <div className="text-left">
                              <p className="text-[8px] uppercase tracking-widest text-slate-400">Cimento (CP II/III)</p>
                              <p className="text-xl font-black text-white">{calcMassa.sacosCimento} Sacos</p>
                              <p className="text-[8px] text-slate-500 font-bold uppercase">~{calcMassa.cimentoKg.toFixed(0)} kg</p>
                            </div>
                            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                              <Layers size={20} />
                            </div>
                          </div>
                          
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                            <div className="text-left">
                              <p className="text-[8px] uppercase tracking-widest text-slate-400">Areia Média/Fina</p>
                              <p className="text-xl font-black text-white">{calcMassa.areiaM3.toFixed(2)} m³</p>
                              <p className="text-[8px] text-slate-500 font-bold uppercase">Areia lavada</p>
                            </div>
                            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                              <Box size={20} />
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-blue-600/20 rounded-2xl border border-blue-500/30">
                          <p className="text-[9px] font-black uppercase tracking-widest text-blue-300">Rendimento Estimado</p>
                          <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                            Para {massa.area}m² com {massa.thickness}cm de espessura, você terá um rendimento de {calcMassa.volumeM3.toFixed(3)}m³ de massa pronta.
                          </p>
                        </div>
                      </div>
                    ) : activeTab === 'massa' ? (
                      <div className="py-12 opacity-30">
                        <Paintbrush size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Informe área e espessura...</p>
                      </div>
                    ) : (
                      <div className="text-5xl font-black tracking-tighter mb-2">
                        {activeTab === 'm2' && m2Result}
                        {activeTab === 'm3' && m3Result}
                        {activeTab === 'materiais' && qtdTijolosComPerda}
                        {activeTab === 'custo' && custoResult}
                        {activeTab === 'maodeobra' && maoDeObraResult}
                        {activeTab === 'lucro' && (
                          <div className="flex flex-col items-center">
                            <span className="text-5xl font-black tracking-tighter">{lucroResult}</span>
                            <div className="mt-4 flex gap-4">
                              <div className="px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                                <p className="text-[8px] uppercase tracking-widest text-blue-400">Lucro Real</p>
                                <p className="text-xs font-bold">{lucroBrutoValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                              </div>
                              <div className="px-3 py-1 bg-white/10 rounded-lg border border-white/10 opacity-50">
                                <p className="text-[8px] uppercase tracking-widest text-slate-400">Opção Markup</p>
                                <p className="text-xs font-bold">{markupResult}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab !== 'analise360' && activeTab !== 'massa' && (
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {activeTab === 'm2' && 'Metros Quadrados (m²)'}
                        {activeTab === 'm3' && 'Metros Cúbicos (m³)'}
                        {activeTab === 'materiais' && 'Tijolos (com 10% perda)'}
                        {activeTab === 'custo' && 'Valor Total da Obra'}
                        {activeTab === 'maodeobra' && 'Total de Mão de Obra'}
                        {activeTab === 'lucro' && 'Preço de Venda Sugerido'}
                      </p>
                    )}
                  </div>

                  <div className="mt-12 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3 max-w-xs text-left">
                    <Info size={16} className="text-blue-400 flex-shrink-0 mt-1" />
                    <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase tracking-wider">
                      {activeTab === 'm2' && 'Dica: Multiplique comprimento por largura para obter a área total.'}
                      {activeTab === 'm3' && 'Dica: Multiplique área pela altura para obter o volume total.'}
                      {activeTab === 'materiais' && `Dica: Sem considerar perdas, seriam necessários ${qtdTijolos} tijolos.`}
                      {activeTab === 'custo' && 'Dica: Mantenha todos os recibos e notas fiscais organizados no sistema.'}
                      {activeTab === 'maodeobra' && 'Dica: Considere encargos sociais e alimentação se aplicável.'}
                      {activeTab === 'lucro' && `Dica: O preço sugerido garante uma margem real de ${lucro.margem}% sobre o valor de venda.`}
                      {activeTab === 'precos' && 'Dica: Valores podem variar de acordo com a região e complexidade do serviço.'}
                      {activeTab === 'analise360' && 'Dica: O Score IA avalia a saúde financeira do projeto. Scores acima de 70 indicam excelente viabilidade.'}
                      {activeTab === 'massa' && 'Dica: O traço 3x1 consome aproximadamente 450kg de cimento por m³ de argamassa.'}
                      {activeTab === 'orcamento' && 'Dica: Gere o PDF e envie diretamente pelo WhatsApp para seu cliente.'}
                    </p>
                  </div>

                  {onNavigate && (
                    <button
                      onClick={() => onNavigate(View.PROFISSIONAIS)}
                      className="mt-6 w-full max-w-xs group flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all duration-300 shadow-lg shadow-blue-600/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                          <HardHat size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest leading-none">Precisa de Mão de Obra?</p>
                          <p className="text-[8px] font-bold text-blue-100 uppercase tracking-wider mt-1">Encontrar Profissionais</p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculadoras;
