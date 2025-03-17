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

// Update the synthesizeSpeech function to use direct streaming with fallback
export async function synthesizeSpeech(text: string, requestId: string): Promise<SynthesizeSpeechResponse> {
  try {
    // Create a direct streaming URL to our API endpoint
    const response = await fetch("/api/synthesize-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })

    // Check if the response is JSON (error or fallback) or audio
    const contentType = response.headers.get("Content-Type")

    if (contentType && contentType.includes("application/json")) {
      // This is a JSON response, likely an error or fallback instruction
      const jsonResponse = await response.json()

      if (jsonResponse.useClientSynthesis) {
        console.log("Using client-side speech synthesis fallback")
        return {
          audioUrl: "",
          text: jsonResponse.text || text,
          useClientSynthesis: true,
        }
      }

      throw new Error(jsonResponse.error || "Unknown error")
    }

    // This is an audio response
    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    return {
      audioUrl,
      text,
      useClientSynthesis: false,
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
  conversationId?: string | null
): Promise<ConversationResponse> {
  try {
    // Retrieve existing conversation history from local storage or state
    let conversationHistory: Message[] = JSON.parse(localStorage.getItem("conversationHistory") || "[]");

    // Append the new message
    conversationHistory.push({ role: "user", content: text });

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
    });

    if (!response.ok) {
      throw new Error("Failed to send conversation message");
    }

    const data = await response.json();

    // Append the assistant's response to history
    conversationHistory.push({ role: "assistant", content: data.text });

    // Save updated history
    localStorage.setItem("conversationHistory", JSON.stringify(conversationHistory));

    return data;
  } catch (error) {
    console.error("Error in conversation:", error);
    throw error;
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

