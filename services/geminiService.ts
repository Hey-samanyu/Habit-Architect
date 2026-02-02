
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
        return `${date}: ${completedCount}/${habits.length} habits done`;
    })
    .join('\n');

  const completedHabitsToday = todayLog?.completedHabitIds || [];
  const activeHabitNames = habits.map(h => h.title).join(', ');
  const completedHabitNames = habits.filter(h => completedHabitsToday.includes(h.id)).map(h => h.title).join(', ');
  const goalStatus = goals.map(g => `${g.title}: ${g.current}/${g.target} ${g.unit}`).join('; ');

  const prompt = `
    You are a friendly personal coach. Look at the user's progress on their goals and habits.

    WHAT WE SEE:
    - Today's Date: ${todayStr}
    - Total habits to track: ${habits.length}
    - Habits finished today: ${completedHabitsToday.length}
    - Habits they planned: ${activeHabitNames}
    - Habits they actually did: ${completedHabitNames}
    - Goals they are working on: ${goalStatus}
    
    RECENT PROGRESS (Last 7 Days):
    ${history}

    YOUR JOB:
    Write a short and helpful update (max 100 words).
    Make it 3 simple parts (no labels, just separate with empty lines):
    1. **What I see**: Look at their week. Are they being steady? Is today a good day or a slow one?
    2. **Next step**: Give them ONE simple thing to focus on right now to stay on track.
    3. **A nice word**: A very short and happy message to keep them feeling good.

    Keep it simple and encouraging. Use bold text for important bits.
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
    return "Sorry, I'm having trouble looking at your progress right now. Please try again soon.";
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

      return `${dayLabel}: ${isDone ? "FINISHED ✅" : "NOT DONE ⭕"}`;
    }).join(" | ");

    const isCompletedToday = logs[todayStr]?.completedHabitIds.includes(h.id);
    const status = isCompletedToday ? 'DONE' : 'NOT DONE';
    
    return `• ${h.title} (${h.frequency})
      - Streak: ${h.streak} days
      - Last few days: ${historyDetails}
      - Today's Status: [${status}]`;
  }).join('\n');

  const goalContext = goals.map(g => {
    const percent = Math.floor((g.current / g.target) * 100);
    const remaining = Math.max(0, g.target - g.current);
    const status = g.current >= g.target ? 'FINISHED! 🎉' : 'STILL WORKING ON IT';
    
    return `• ${g.title} (${g.frequency})
      - Progress: ${g.current} / ${g.target} ${g.unit} (${percent}%)
      - Left to go: ${remaining} ${g.unit}
      - Status: ${status}`;
  }).join('\n');

  const systemInstruction = `
    You are Kairo, a friendly and supportive helper for people who want to stay on track with their daily goals.
    
    YOUR JOB:
    Help the user stay steady and finish their tasks. Be like a kind friend who wants them to do well.
    
    USER'S RECENT PROGRESS (Today: ${todayStr}):
    
    === HABITS ===
    ${habitContext}
    
    === GOALS ===
    ${goalContext}

    HOW TO TALK:
    1. **NO BOLD TEXT**: Do NOT use double stars (**). Use emojis or ALL CAPS if you need to emphasize something.
    2. **KEEP IT SIMPLE**: Use single line breaks between every new thought. Do not write long blocks of text.
    3. **WORDS**: Keep it under 150 words. Be clear and kind.
    4. **LISTS**: Use simple dots (•) for lists.
    5. **BE HELPFUL**: Start by talking about what they did or missed (for example, "I saw you missed your meditation yesterday").
    
    ADVICE:
    - If they haven't done a habit yet today, remind them to do it now.
    - If they missed yesterday, encourage them to start again today.
    - If they are almost finished with a goal, cheer them on to do the last bit.
    
    Example:
    "WOW! You are doing great with your reading goal. Only 5 pages left. You can finish that today!
    
    • I saw you missed your run yesterday and haven't gone today yet.
    • Maybe put your shoes on and go for just 10 minutes right now?
    
    You've got this, let's keep going!"
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
