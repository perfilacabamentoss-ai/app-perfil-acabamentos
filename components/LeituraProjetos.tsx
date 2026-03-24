
import React, { useState, useRef } from 'react';
import { 
  FileSearch, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Layers, 
  ClipboardList,
  ArrowRight,
  Sparkles,
  Download,
  X,
  Plus
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface AnalyzedMaterial {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

interface AnalyzedStage {
  name: string;
  description: string;
}

const LeituraProjetos: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ 
    materials: AnalyzedMaterial[], 
    stages: AnalyzedStage[],
    clientName?: string,
    projectAddress?: string,
    projectName?: string,
    estimatedValue?: number,
    projectDate?: string
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualDescription, setManualDescription] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [selectedWork, setSelectedWork] = useState('');
  const [works] = useState<any[]>(() => {
    const saved = localStorage.getItem('perfil_works');
    return saved ? JSON.parse(saved) : [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      
      // DWG check - we'll allow the extension but warn it might not work as well as PDF
      const isDwg = selectedFile.name.toLowerCase().endsWith('.dwg');
      
      if (!allowedTypes.includes(selectedFile.type) && !isDwg) {
        setError('Por favor, envie um arquivo PDF, Imagem (JPG/PNG) ou DWG.');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const analyzeProject = async () => {
    if (!file && !manualDescription) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let base64Data = '';
      let mimeType = '';

      if (file) {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
        });
        reader.readAsDataURL(file);
        base64Data = await base64Promise;
        mimeType = file.type || 'application/octet-stream';
      }

      const prompt = file 
        ? `Analise este projeto de engenharia/arquitetura. 
          Identifique:
          1. Uma lista de materiais necessários (nome, quantidade aproximada, unidade, categoria).
          2. As principais etapas da obra descritas ou implícitas no projeto.
          3. O nome do cliente (se disponível).
          4. O endereço da obra (se disponível).
          5. Um nome sugerido para o projeto/obra.
          6. Valor estimado da obra (se disponível).
          7. Data do projeto (se disponível).
          
          Seja preciso e técnico. Retorne os dados em formato JSON estruturado.`
        : `Com base na seguinte descrição de obra/projeto: "${manualDescription}", gere:
          1. Uma lista de materiais necessários (nome, quantidade aproximada, unidade, categoria).
          2. As principais etapas da obra sugeridas para este tipo de execução.
          3. Um nome sugerido para o projeto/obra.
          4. Valor estimado da obra (estimativa de mercado 2026).
          
          Seja preciso e técnico. Retorne os dados em formato JSON estruturado.`;

      const contents: any[] = [
        {
          parts: [
            { text: prompt }
          ]
        }
      ];

      if (file) {
        contents[0].parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              materials: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    category: { type: Type.STRING }
                  },
                  required: ["name", "quantity", "unit", "category"]
                }
              },
              stages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                }
              },
              clientName: { type: Type.STRING },
              projectAddress: { type: Type.STRING },
              projectName: { type: Type.STRING },
              estimatedValue: { type: Type.NUMBER },
              projectDate: { type: Type.STRING }
            },
            required: ["materials", "stages"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao analisar o projeto. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const importToSystem = () => {
    if (!result) return;

    // Check if this file has already been imported
    if (file) {
      const importedFilesKey = 'perfil_imported_projects';
      const savedImportedFiles = localStorage.getItem(importedFilesKey);
      const importedFiles: string[] = savedImportedFiles ? JSON.parse(savedImportedFiles) : [];

      if (importedFiles.includes(file.name)) {
        alert(`AVISO: O projeto "${file.name}" já foi importado anteriormente para o sistema. A operação foi cancelada para evitar duplicidade de materiais.`);
        return;
      }
    }

    // 1. Automatic Registration of Client if extracted
    let finalClientId = '';
    if (result.clientName) {
      const savedClients = localStorage.getItem('perfil_clientes');
      const existingClients = savedClients ? JSON.parse(savedClients) : [];
      const foundClient = existingClients.find((c: any) => c.name.toLowerCase() === result.clientName?.toLowerCase());
      
      if (!foundClient) {
        const newClient = {
          id: Math.random().toString(36).substr(2, 9),
          name: result.clientName,
          email: '',
          phone: '',
          address: result.projectAddress || '',
          cpf_cnpj: '',
          status: 'Ativo',
          registrationDate: new Date().toLocaleDateString('pt-BR'),
          observations: `Cadastrado automaticamente via IA Leitora de Projetos (${file ? 'Arquivo: ' + file.name : 'Manual'})`
        };
        localStorage.setItem('perfil_clientes', JSON.stringify([newClient, ...existingClients]));
        finalClientId = newClient.id;
      } else {
        finalClientId = foundClient.id;
      }
    }

    // 2. Automatic Registration of Work if extracted
    let finalWorkId = selectedWork;
    let finalWorkName = 'Geral';

    // Find the name of the selected work if it exists
    if (finalWorkId) {
      const work = works.find(w => w.id === finalWorkId);
      if (work) finalWorkName = work.name;
    }

    if (!finalWorkId && (result.projectName || result.projectAddress || result.clientName)) {
      const savedWorks = localStorage.getItem('perfil_works');
      const existingWorks = savedWorks ? JSON.parse(savedWorks) : [];
      const workName = result.projectName || (result.clientName ? `Obra ${result.clientName}` : 'Nova Obra');
      const foundWork = existingWorks.find((w: any) => w.name.toLowerCase() === workName.toLowerCase());

      if (!foundWork) {
        const newWork = {
          id: Math.random().toString(36).substr(2, 9),
          name: workName,
          client: result.clientName || 'Cliente não identificado',
          address: result.projectAddress || 'Endereço não identificado',
          status: 'Em Planejamento',
          progress: 0,
          startDate: result.projectDate || new Date().toLocaleDateString('pt-BR'),
          endDate: '',
          budget: result.estimatedValue || 0,
          observations: `Cadastrada automaticamente via IA Leitora de Projetos (${file ? 'Arquivo: ' + file.name : 'Manual'})`
        };
        localStorage.setItem('perfil_works', JSON.stringify([newWork, ...existingWorks]));
        finalWorkId = newWork.id;
        finalWorkName = newWork.name;
      } else {
        finalWorkId = foundWork.id;
        finalWorkName = foundWork.name;
      }
    }

    // Fallback if still no work ID
    if (!finalWorkId) {
      finalWorkId = 'Geral';
      finalWorkName = 'Geral';
    }

    // Import Materials
    if (result.materials && result.materials.length > 0) {
      const savedMaterials = localStorage.getItem('perfil_materials');
      const existingMaterials = savedMaterials ? JSON.parse(savedMaterials) : [];
      
      const newMaterials = result.materials.map((m: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: m.name,
        category: m.category,
        quantity: 0, // Initial stock is 0
        unit: m.unit,
        unitPrice: 0,
        minStock: 5,
        lastRestock: new Date().toLocaleDateString('pt-BR'),
        workId: finalWorkId, // Linking to the work/project ID
        workName: finalWorkName, // Store the name for display
        observations: `Importado do projeto: ${file ? file.name : 'Manual'}`
      }));

      localStorage.setItem('perfil_materials', JSON.stringify([...existingMaterials, ...newMaterials]));
    }

    // Import Stages as Templates
    if (result.stages && result.stages.length > 0) {
      const savedTemplates = localStorage.getItem('perfil_stages_templates');
      const existingTemplates = savedTemplates ? JSON.parse(savedTemplates) : [];
      
      const currentTotal = existingTemplates.length;
      
      const orderedTemplates = result.stages.map((stage: any, index: number) => ({
        ...stage,
        id: Math.random().toString(36).substr(2, 9),
        order: currentTotal + index + 1,
        projectId: file ? file.name : 'Manual',
        createdAt: new Date().toISOString()
      }));
      
      localStorage.setItem('perfil_stages_templates', JSON.stringify([...existingTemplates, ...orderedTemplates]));
    }

    // Create real Stages for the selected work if one is selected
    if (finalWorkId && result.stages && result.stages.length > 0) {
      const savedStages = localStorage.getItem('perfil_stages');
      const existingStages = savedStages ? JSON.parse(savedStages) : [];
      
      // Filter stages already belonging to this work to maintain proper order
      const workStages = existingStages.filter((s: any) => s.workId === finalWorkId);
      const startOrder = workStages.length;

      const newRealStages = result.stages.map((s: any, idx: number) => ({
        id: `s${Date.now()}${idx}`,
        name: s.name,
        workId: finalWorkId,
        status: 'Pendente',
        progress: 0,
        order: startOrder + idx + 1,
        media: [
          {
            id: `m${Math.random()}`,
            type: 'image',
            url: 'https://picsum.photos/seed/projeto/200/200', // Placeholder for project reference
            name: `Referência: ${file ? file.name : 'Manual'}`,
            timestamp: new Date().toLocaleString('pt-BR'),
            size: '0.1 MB'
          }
        ]
      }));
      
      localStorage.setItem('perfil_stages', JSON.stringify([...existingStages, ...newRealStages]));
    }

    if (file) {
      const importedFilesKey = 'perfil_imported_projects';
      const savedImportedFiles = localStorage.getItem(importedFilesKey);
      const importedFiles: string[] = savedImportedFiles ? JSON.parse(savedImportedFiles) : [];
      localStorage.setItem(importedFilesKey, JSON.stringify([...importedFiles, file.name]));
    }

    // Notify App.tsx to update tooltip
    window.dispatchEvent(new Event('storage'));

    alert(`Dados importados com sucesso! ${result.clientName ? `Cliente "${result.clientName}" cadastrado/verificado.` : ''} ${finalWorkName ? `Obra "${finalWorkName}" cadastrada/verificada e etapas criadas.` : ''} Materiais adicionados ao estoque.`);
    setResult(null);
    setFile(null);
    setManualDescription('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">IA Leitora de Projetos</h1>
          <p className="text-slate-500 mt-2 font-medium">Análise avançada de PDF/DWG para levantamento automático de materiais</p>
        </div>
        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-200 animate-bounce">
          <Sparkles size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex flex-col gap-4">
            <div 
              className={`bg-white p-8 rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[250px] ${
                file ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
              }`}
              onClick={() => {
                setShowManualInput(false);
                fileInputRef.current?.click();
              }}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept=".pdf,.dwg,.jpg,.jpeg,.png,.webp"
              />
              
              {file ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-200 relative group/fileinfo">
                    <FileText size={40} />
                    
                    {/* Tooltip on file hover */}
                    <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 bg-[#0b1222] text-white rounded-2xl shadow-2xl border border-white/10 p-5 opacity-0 invisible group-hover/fileinfo:opacity-100 group-hover/fileinfo:visible transition-all duration-300 z-50 pointer-events-none">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                        <Sparkles size={14} className="text-blue-400" />
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Respaldo das Análises</p>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed mb-4">
                        As informações extraídas deste arquivo serão distribuídas nos seguintes campos:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[9px] font-bold text-white uppercase tracking-tight">Estoque de Materiais</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <p className="text-[9px] font-bold text-white uppercase tracking-tight">Cronograma de Etapas</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">
                          Veja o guia completo na foto do perfil no topo
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-black text-slate-900 uppercase tracking-tight truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setResult(null);
                    }}
                    className="text-rose-500 hover:text-rose-700 text-[10px] font-black uppercase tracking-widest"
                  >
                    Remover Arquivo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
                    <Upload size={40} />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 uppercase tracking-tight">Upload de Projeto</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest leading-relaxed">
                      PDF, DWG ou Imagens
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center px-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OU</span>
            </div>

            <div 
              onClick={() => {
                setShowManualInput(true);
                setFile(null);
                setResult(null);
              }}
              className={`bg-white p-8 rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[150px] ${
                showManualInput ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${showManualInput ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <FileText size={24} />
                </div>
                <div className="text-left">
                  <p className="font-black text-slate-800 uppercase tracking-tight">Descrição Manual</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sem arquivo</p>
                </div>
              </div>
            </div>
          </div>

          {showManualInput && (
            <div className="space-y-4 animate-in slide-in-from-top duration-300">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descreva a obra/projeto</label>
              <textarea 
                className="w-full px-6 py-4 bg-white border border-slate-200 rounded-3xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
                placeholder="Ex: Reforma de um banheiro de 5m² com troca de revestimentos..."
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
              />
            </div>
          )}

          {(file || manualDescription) && !result && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vincular à Obra (Opcional)</label>
                <select 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs"
                  value={selectedWork}
                  onChange={e => setSelectedWork(e.target.value)}
                >
                  <option value="">Selecione uma obra...</option>
                  {works.map(work => (
                    <option key={work.id} value={work.id}>{work.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={analyzeProject}
                  disabled={isAnalyzing}
                  className="flex-1 py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <FileSearch size={24} />
                      Iniciar IA
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4 text-rose-600">
              <AlertCircle size={20} className="flex-shrink-0 mt-1" />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-8">
          {!result && !isAnalyzing && (
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200">
                <FileSearch size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tight">Aguardando Projeto</h3>
              <p className="text-slate-400 mt-4 max-w-sm font-medium">
                Faça o upload do arquivo técnico para que nossa IA realize o levantamento automático de materiais e etapas.
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="relative">
                <div className="w-32 h-32 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <Sparkles size={32} className="animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mt-8">Processando Arquivo</h3>
              <p className="text-slate-500 mt-4 max-w-sm font-medium">
                Nossa inteligência artificial está lendo as plantas, identificando cotas e extraindo especificações técnicas...
              </p>
              <div className="mt-8 w-full max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 animate-progress-indefinite"></div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Sparkles className="text-blue-600" size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Informações do Projeto</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliente Identificado</p>
                    <p className="text-sm font-bold text-slate-800 uppercase">{result.clientName || 'Não identificado'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Endereço da Obra</p>
                    <p className="text-sm font-bold text-slate-800 uppercase">{result.projectAddress || 'Não identificado'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome Sugerido para a Obra</p>
                    <p className="text-sm font-bold text-slate-800 uppercase">{result.projectName || 'Não identificado'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Estimado / Data</p>
                    <p className="text-sm font-bold text-slate-800 uppercase">
                      {result.estimatedValue ? `R$ ${result.estimatedValue.toLocaleString('pt-BR')}` : 'Valor não identificado'} 
                      {result.projectDate ? ` - ${result.projectDate}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <ClipboardList className="text-emerald-600" size={20} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Materiais Identificados</h2>
                  </div>
                  <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {result.materials.length} Itens
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.materials.map((m, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.category}</p>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mt-1">{m.name}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-blue-600 tracking-tight">{m.quantity}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{m.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Layers className="text-purple-600" size={20} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Etapas Sugeridas</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {result.stages.map((s, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-6 items-start group hover:bg-white hover:shadow-md transition-all">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400 font-black text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.name}</h4>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={importToSystem}
                  className="flex-1 py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3"
                >
                  <Plus size={24} />
                  Importar para o Sistema
                </button>
                <button 
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                    setError(null);
                    fileInputRef.current?.click();
                  }}
                  className="px-8 py-6 bg-blue-50 text-blue-600 border border-blue-100 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-3"
                >
                  <Upload size={24} />
                  Novo Arquivo
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-10 py-6 bg-slate-100 text-slate-600 rounded-[2rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
                >
                  <Download size={24} />
                  PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeituraProjetos;
