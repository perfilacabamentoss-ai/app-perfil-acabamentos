
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getConstructionAdvice = async (stage: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Forneça 3 dicas práticas para a etapa de "${stage}" na construção civil, focando em redução de custos e qualidade de acabamento.`,
      config: {
        systemInstruction: "Você é um mestre de obras sênior especializado em acabamentos de alto padrão.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao obter conselhos do Gemini:", error);
    return "Desculpe, não conseguimos obter dicas no momento.";
  }
};

export const findBestMaterialPrice = async (materialName: string, projectAddress: string) => {
  try {
    const ai = getAI();
    // Using gemini-3-flash-preview with googleSearch for better price finding and JSON support
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Encontre o menor preço para o material "${materialName}" em lojas físicas ou sites de fornecedores que estejam localizados ou façam entregas em um raio de no máximo 75km do endereço do cliente: "${projectAddress}". 
      É CRÍTICO que o fornecedor esteja dentro deste raio de 75km ou garanta entrega rápida nesta região.
      Retorne o menor preço unitário encontrado, o nome do fornecedor, a distância aproximada (se disponível) e o link direto para a oferta ou site do fornecedor.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um assistente de compras especializado em construção civil no Brasil. Seu objetivo é encontrar o melhor preço para materiais de construção, priorizando fornecedores locais num raio de 75km do endereço fornecido para minimizar custos e tempo de frete. Se não encontrar o preço exato, forneça uma estimativa baseada em grandes varejistas que entregam na região.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            price: { type: Type.NUMBER, description: "O menor preço unitário encontrado (apenas o número)" },
            supplier: { type: Type.STRING, description: "Nome da loja ou fornecedor" },
            distance: { type: Type.STRING, description: "Distância estimada ou confirmação de 'Dentro do raio de 75km'" },
            sourceUrl: { type: Type.STRING, description: "Link direto para o produto ou site da loja" }
          },
          required: ["price", "supplier"]
        }
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar preços via Gemini:", error);
    return null;
  }
};

export const generateStrategicPlanning = async (projectData: any) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Gere um planejamento estratégico detalhado para a obra: "${projectData.name}".
      Dados da Obra: ${JSON.stringify(projectData)}
      
      Siga rigorosamente as instruções de:
      - Divisão por 6 Etapas Executivas (Fundação, Estrutura, Alvenaria, Cobertura, Instalações, Revestimentos).
      - Custo Real de Material e Mão de Obra (Atualizado 2026).
      - Equipe ideal para concluir cada etapa em no máximo 30 dias.
      - Memória de cálculo simplificada.
      - Custo acumulado.
      
      Retorne em formato Markdown profissional para o Administrador.`,
      config: {
        systemInstruction: "Você é um Engenheiro Civil Especialista em Orçamentação Executiva e Planejamento Estratégico de Obras. Modo Administrador Ativo. Informações confidenciais.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao gerar planejamento estratégico:", error);
    return "Erro ao processar o planejamento estratégico.";
  }
};

export const extractMaterialsFromProject = async (projectName: string, projectType: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Com base no nome do projeto técnico "${projectName}" (Tipo: ${projectType}), gere uma lista de 5 a 8 materiais essenciais que seriam necessários para executar esta parte da obra. 
      Retorne uma lista de objetos com nome, categoria, quantidade sugerida, unidade e preço unitário estimado de mercado (2026).`,
      config: {
        systemInstruction: "Você é um orçamentista de obras sênior. Gere estimativas realistas para materiais de construção.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING, description: "Básico, Acabamento, Ferragens, Elétrico, Hidráulico, Ferramentas ou Químicos" },
              quantity: { type: Type.NUMBER },
              unit: { type: Type.STRING, description: "Sacos, Peças, Unidades, m², Metros, Litros ou Kg" },
              unitPrice: { type: Type.NUMBER }
            },
            required: ["name", "category", "quantity", "unit", "unitPrice"]
          }
        }
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Erro ao extrair materiais via Gemini:", error);
    return [];
  }
};

export const extractServicesFromProject = async (projectName: string, projectType: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Com base no nome do projeto técnico "${projectName}" (Tipo: ${projectType}), gere uma lista de 5 a 8 serviços/etapas de execução que seriam necessários para realizar esta parte da obra. 
      Retorne uma lista de objetos com nome do serviço, descrição detalhada, tempo estimado (em dias) e equipe sugerida.`,
      config: {
        systemInstruction: "Você é um mestre de obras sênior e planejador de execução. Gere listas de serviços realistas e técnicas.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nome do serviço (ex: Alvenaria de vedação)" },
              description: { type: Type.STRING, description: "Descrição técnica do que será executado" },
              estimatedDays: { type: Type.NUMBER, description: "Tempo estimado em dias" },
              suggestedTeam: { type: Type.STRING, description: "Equipe necessária (ex: 2 Pedreiros, 1 Ajudante)" }
            },
            required: ["name", "description", "estimatedDays", "suggestedTeam"]
          }
        }
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Erro ao extrair serviços via Gemini:", error);
    return [];
  }
};
