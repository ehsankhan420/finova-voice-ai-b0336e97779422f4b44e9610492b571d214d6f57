import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting synthesize-speech endpoint...")

    const { text } = await request.json()

    if (!text) {
      console.log("No text provided")
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    // Validate ELEVENLABS_API_KEY
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    if (!elevenLabsApiKey) {
      console.error("ELEVENLABS_API_KEY not found in environment variables")
      return NextResponse.json({ error: "Server configuration error: Missing API key" }, { status: 500 })
    }

    // Create tmp directory if it doesn't exist
    const tmpDir = path.join(process.cwd(), "tmp")
    if (!existsSync(tmpDir)) {
      console.log("Creating tmp directory...")
      await mkdir(tmpDir, { recursive: true })
    }

    // Default voice ID for ElevenLabs
    const voiceId = "EXAVITQu4vr4xnSDxMaL"

    console.log("Making request to ElevenLabs API...")
    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text()
      console.error("ElevenLabs API error:", errorText)
      return NextResponse.json(
        { error: "Failed to synthesize speech with ElevenLabs API" },
        { status: elevenLabsResponse.status },
      )
    }

    // Get the audio data
    const audioBuffer = await elevenLabsResponse.arrayBuffer()

    // Generate unique filename and save the audio file
    const audioFilename = `${uuidv4()}.mp3`
    const audioPath = path.join(tmpDir, audioFilename)

    console.log("Saving audio file to:", audioPath)
    await writeFile(audioPath, Buffer.from(audioBuffer))

    // Return the audio file path
    const audioUrl = `/api/audio/${audioFilename}`
    console.log("Successfully synthesized speech")
    return NextResponse.json({ audioUrl })
  } catch (error) {
    console.error("Error in synthesize-speech endpoint:", error)
    return NextResponse.json(
      {
        error: "Failed to synthesize speech",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}