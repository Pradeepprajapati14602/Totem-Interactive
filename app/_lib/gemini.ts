import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY not configured. AI features will be disabled.');
}

const ai = new GoogleGenAI({ apiKey });

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });
    
    if (!response.embeddings?.[0]?.values) {
      throw new Error('Empty embedding response');
    }
    
    return response.embeddings[0].values;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    throw error;
  }
}


export async function summarizeMemories(memories: string[]): Promise<string> {
  const prompt = `You are an AI memory consolidation system. Analyze the following memories and create a concise, meaningful summary that captures the essential information and patterns:

Memories:
${memories.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Provide a coherent summary that:
1. Identifies common themes and patterns
2. Preserves important details
3. Reduces redundancy
4. Maintains chronological context where relevant

Summary:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    if (!response.text) {
      throw new Error('Empty summary response');
    }
    
    return response.text;
  } catch (error) {
    console.error('Memory summarization failed:', error);
    throw error;
  }
}


export async function generateInsights(content: string): Promise<string> {
  const prompt = `Analyze this memory and extract key insights, patterns, or important information:

Memory: ${content}

Insights:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    if (!response.text) {
      throw new Error('Empty insights response');
    }
    
    return response.text;
  } catch (error) {
    console.error('Insight generation failed:', error);
    throw error;
  }
}

export default ai;
