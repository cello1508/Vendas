import { GoogleGenAI, Type } from "@google/genai";
import { Sale, MonthGoal, Insight } from "../types";

// Helper function to format currency for the prompt
const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const generateSalesInsights = async (sales: Sale[], goals: MonthGoal): Promise<Insight[]> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Returning mock data.");
    return [
      { title: "API Key Ausente", message: "Configure sua chave de API para receber insights reais.", type: "neutral" }
    ];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);
  const totalCount = sales.length;
  const percentageRevenue = (totalRevenue / goals.revenue) * 100;

  // Construct a prompt summarizing the current state
  const prompt = `
    Atue como um analista de vendas sênior e motivador.
    
    Dados Atuais:
    - Faturamento Atual: ${formatBRL(totalRevenue)}
    - Meta de Faturamento: ${formatBRL(goals.revenue)}
    - Progresso Faturamento: ${percentageRevenue.toFixed(1)}%
    - Vendas Realizadas: ${totalCount}
    - Meta de Quantidade: ${goals.count}
    - Histórico Recente (últimas 5): ${JSON.stringify(sales.slice(0, 5))}
    
    Gere 3 insights curtos e acionáveis em formato JSON.
    1. Um insight sobre o progresso geral (motivacional ou alerta).
    2. Um insight sobre o ticket médio (comparando faturamento/quantidade).
    3. Uma sugestão prática para bater a meta.
    
    Responda APENAS com o JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              message: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["positive", "neutral", "negative"] }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as Insight[];

  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      {
        title: "Erro na Análise",
        message: "Não foi possível gerar insights no momento. Tente novamente.",
        type: "negative"
      }
    ];
  }
};
