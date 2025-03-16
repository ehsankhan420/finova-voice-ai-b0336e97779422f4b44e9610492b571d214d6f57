import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, conversationId, conversationHistory = [] } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    // Get Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      console.error("Gemini API key not configured")
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    // Format conversation history for Gemini API
    const formattedHistory = conversationHistory.map((message: any) => ({
      role: message.role === "user" ? "user" : "model",
      parts: [{ text: message.content }],
    }))

    // Prepare the request body for Gemini API
    const requestBody = {
      contents: [
        ...formattedHistory,
        {
          role: "user",
          parts: [{ text }],
        },
      ],
      generation_config: {
        temperature: 0.7,
        top_p: 0.95,
        top_k: 40,
        max_output_tokens: 1024,
      },
    }

    // Make request to Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    )

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error("Gemini API error:", errorData)
      return NextResponse.json({ error: "Failed to process with Gemini API" }, { status: 500 })
    }

    const geminiData = await geminiResponse.json()

    // Extract text from Gemini response
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated"

    return NextResponse.json({
      text: responseText,
      conversationId: conversationId || Date.now().toString(),
    })
  } catch (error) {
    console.error("Error in conversation endpoint:", error)
    return NextResponse.json({ error: "Failed to process conversation" }, { status: 500 })
  }
}

