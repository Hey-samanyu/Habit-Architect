
import { GoogleGenAI, Chat, Modality, Content } from "@google/genai";
import { format, subDays } from 'date-fns';
import { Habit, Goal, DailyLog } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Audio Decoding Helpers ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const speakText = async (text: string): Promise<void> => {
  const ai = getAIClient();
  if (!ai) return;

  try {
    // Clean text of simple markdown for better speech
    const cleanText = text.replace(/\*\*/g, '').replace(/•/g, '.').trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is a good neutral/friendly voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        console.warn("No audio data returned from Gemini.");
        return;
    }

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      outputAudioContext,
      24000,
      1,
    );
    
    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioContext.destination);
    source.start();

  } catch (error) {
    console.error("TTS Error:", error);
  }
};

// --- Existing Service Functions ---

export const generateDailyOverview = async (
  habits: Habit[],
  goals: Goal[],
  logs: Record<string, DailyLog>
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Unable to connect to AI service. Please check API key.";

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs[todayStr];
  
  // Gather last 7 days of history string
  const history = Object.keys(logs)
    .sort()
    .slice(-7)
    .map(date => {
        const log = logs[date];
        const completedCount = log.completedHabitIds.length;
        return `${date}: ${completedCount}/${habits.length} habits`;
    })
    .join('\n');

  const completedHabitsToday = todayLog?.completedHabitIds || [];
  const activeHabitNames = habits.map(h => h.title).join(', ');
  const completedHabitNames = habits.filter(h => completedHabitsToday.includes(h.id)).map(h => h.title).join(', ');
  const goalStatus = goals.map(g => `${g.title}: ${g.current}/${g.target} ${g.unit}`).join('; ');

  const prompt = `
    You are an elite productivity coach. Analyze the user's habit tracker data.

    CONTEXT:
    - Today: ${todayStr}
    - Total Habits: ${habits.length}
    - Habits Completed Today: ${completedHabitsToday.length}
    - Active Habits List: ${activeHabitNames}
    - Completed Today: ${completedHabitNames}
    - Goals Status: ${goalStatus}
    
    RECENT HISTORY (Last 7 Days):
    ${history}

    TASK:
    Provide a brief, high-impact daily briefing (max 130 words).
    Structure your response in 3 short paragraphs (do not label them, just separate by newlines):
    1. **Insight**: Analyze the recent trend. Are they consistent? Is today a dip or a peak?
    2. **Focus**: Suggest ONE specific thing to focus on right now (e.g. finishing a specific goal or maintaining a streak).
    3. **Motivation**: A short, punchy, relevant quote or affirmation.

    Keep the tone encouraging but analytical. Use bolding for key terms.
  `;

  try {
    // Update to 'gemini-3-flash-preview' for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.7,
      }
    });
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble analyzing your data right now. Please try again later.";
  }
};

export const createChatSession = (
  habits: Habit[],
  goals: Goal[],
  logs: Record<string, DailyLog>,
  history: Content[] = []
): Chat | null => {
  const ai = getAIClient();
  if (!ai) return null;

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // Calculate last 3 days for context (Today, Yesterday, Day Before)
  const last3Days = [
    todayStr,
    format(subDays(today, 1), 'yyyy-MM-dd'),
    format(subDays(today, 2), 'yyyy-MM-dd')
  ];

  // Construct a rich context for Kairo
  const habitContext = habits.map(h => {
    // Build a highly descriptive history string
    const historyDetails = last3Days.map(date => {
      const log = logs[date];
      const isDone = log?.completedHabitIds.includes(h.id);
      
      let dayLabel = date;
      if (date === todayStr) dayLabel = "Today";
      else if (date === last3Days[1]) dayLabel = "Yesterday";
      else dayLabel = format(new Date(date), 'MMM d');

      return `${dayLabel}: ${isDone ? "COMPLETED ✅" : "MISSED ⭕"}`;
    }).join(" | ");

    const isCompletedToday = logs[todayStr]?.completedHabitIds.includes(h.id);
    const status = isCompletedToday ? 'DONE' : 'PENDING';
    
    return `• ${h.title} (${h.frequency})
      - Current Streak: ${h.streak} days
      - Recent History: ${historyDetails}
      - Today's Status: [${status}]`;
  }).join('\n');

  const goalContext = goals.map(g => {
    const percent = Math.floor((g.current / g.target) * 100);
    const remaining = Math.max(0, g.target - g.current);
    const status = g.current >= g.target ? 'ACHIEVED 🎉' : 'IN PROGRESS';
    
    return `• ${g.title} (${g.frequency})
      - Progress: ${g.current} / ${g.target} ${g.unit} (${percent}%)
      - Remaining to Goal: ${remaining} ${g.unit}
      - Status: ${status}`;
  }).join('\n');

  const systemInstruction = `
    You are Kairo, a world-class habit coach and accountability partner.
    
    YOUR MISSION:
    Your goal is to help the user achieve 100% consistency and crush their goals.
    
    USER'S DATA SNAPSHOT (Today: ${todayStr}):
    
    === HABITS ===
    ${habitContext}
    
    === GOALS ===
    ${goalContext}

    STRICT RESPONSE GUIDELINES:
    1. **NO MARKDOWN BOLDING**: Do NOT use double asterisks (**). They break the app's display. Use emojis or CAPITALS for emphasis instead.
    2. **STRUCTURE**: You MUST use line breaks between every distinct thought or sentence group. Never write long paragraphs.
    3. **LENGTH**: Keep it under 150 words. Be punchy and direct.
    4. **FORMATTING**: Use bullet points (•) for lists.
    5. **ACTION-FIRST**: Start with specific feedback based on the data above (e.g., "You missed Meditation yesterday").
    
    ADVICE LOGIC:
    - If a habit status is [PENDING] for Today, tell them to do it NOW.
    - If they missed Yesterday, ask them why or encourage them to restart the streak.
    - If a Goal is close to completion (e.g. >80%), hype them up to finish it.
    
    Example Response:
    "🔥 You are crushing your Reading goal! Only 5 pages left. Finish that today.
    
    • However, you missed Running yesterday and today is still PENDING.
    • Get your shoes on and go for a 10-minute run to keep the streak alive.
    
    No excuses, let's get it done!"
  `;

  // Update to 'gemini-3-flash-preview' for chat session
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction,
      temperature: 0.7,
    },
    history: history
  });
};
