const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface ProcessVoiceResponse {
  text: string
  requestId: string
}

interface SynthesizeSpeechResponse {
  audioUrl: string
  text: string
  useClientSynthesis: boolean
}

interface ConversationResponse {
  text: string
  conversationId: string
}

export interface Message {
  role: "user" | "assistant"
  content: string
}

export async function processVoice(formData: FormData): Promise<ProcessVoiceResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/process-voice`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to process voice")
    }

    return await response.json()
  } catch (error) {
    console.error("Error processing voice:", error)
    throw error
  }
}

export async function synthesizeSpeech(text: string, requestId: string): Promise<SynthesizeSpeechResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/synthesize-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, requestId }),
    })

    if (!response.ok) {
      throw new Error("Failed to synthesize speech")
    }

    const data = await response.json()

    // Return the text along with the audio URL
    return {
      audioUrl: data.audioUrl || "",
      text: data.text || text,
      useClientSynthesis: data.useClientSynthesis || false,
    }
  } catch (error) {
    console.error("Error synthesizing speech:", error)
    // Return the original text so the client can use browser speech synthesis
    return {
      audioUrl: "",
      text: text,
      useClientSynthesis: true,
    }
  }
}

export async function sendConversationMessage(
  text: string,
  conversationId?: string | null,
  conversationHistory: Message[] = [],
): Promise<ConversationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        conversationId,
        conversationHistory,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to send conversation message")
    }

    return await response.json()
  } catch (error) {
    console.error("Error in conversation:", error)
    throw error
  }
}

export async function getHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/history`)

    if (!response.ok) {
      throw new Error("Failed to fetch history")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching history:", error)
    throw error
  }
}

