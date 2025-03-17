"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Volume2, Loader2, VolumeX, Sparkles } from "lucide-react"
import { createSpeechRecognition } from "@/lib/speech-recognition"
import { synthesizeSpeech, sendConversationMessage, type Message } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { cn, formatTime } from "@/lib/utils"

export const VoiceCall = ({ onEndCall }: { onEndCall?: () => void }) => {
  const [transcription, setTranscription] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [audioVisualization, setAudioVisualization] = useState<number[]>([])
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null)
  const [listeningDuration, setListeningDuration] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [isMuted, setIsMuted] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const listeningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpeechRef = useRef<number>(Date.now())
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversationHistory])

  // Initialize speech recognition and set up keep-alive
  useEffect(() => {
    if (typeof window !== "undefined" && isActive && !isMuted && !isSpeaking) {
      console.log("Setting up initial speech recognition")
      setupAndStartRecognition()

      // Set up a keep-alive interval
      keepAliveIntervalRef.current = setInterval(() => {
        if (!isListening && !isProcessing && !isSpeaking && isActive && !isMuted) {
          console.log("Keep-alive: restarting speech recognition")
          setupAndStartRecognition()
        }
      }, 10000) // Check every 10 seconds
    }

    return () => {
      cleanupSpeechRecognition()
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current)
        keepAliveIntervalRef.current = null
      }
    }
  }, [isActive, isSpeaking])

  // Handle mute state changes
  useEffect(() => {
    if (isMuted) {
      // When muted, stop recognition
      stopRecognition()

      // Also stop any playing audio
      if (audioRef.current && audioRef.current.paused === false) {
        audioRef.current.pause()
        setIsSpeaking(false)
      }
    } else if (isActive && !isProcessing && !isSpeaking) {
      // When unmuted, start recognition only if not speaking
      console.log("Unmuted, starting recognition")
      setupAndStartRecognition()
    }
  }, [isMuted, isSpeaking])

  // Add effect to stop recognition when speaking starts
  useEffect(() => {
    if (isSpeaking) {
      console.log("AI is speaking - stopping microphone")
      stopRecognition()
    } else if (isActive && !isMuted && !isProcessing && !isSpeaking) {
      console.log("AI finished speaking - restarting microphone")
      // Small delay to ensure audio playback is fully complete
      setTimeout(() => {
        setupAndStartRecognition()
      }, 500)
    }
  }, [isSpeaking])

  const setupAndStartRecognition = () => {
    if (!isActive || isMuted || isSpeaking || isProcessing) {
      console.log("Not starting recognition because:", {
        isActive,
        isMuted,
        isSpeaking,
        isProcessing,
      })
      return
    }

    console.log("Setting up speech recognition")

    // Clean up any existing recognition
    stopRecognition()

    // Create a new recognition instance
    recognitionRef.current = createSpeechRecognition()

    if (!recognitionRef.current) {
      console.error("Failed to create speech recognition")
      return
    }

    // Configure recognition
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true

    // Set up event handlers
    recognitionRef.current.onstart = () => {
      console.log("Speech recognition started")
      setIsListening(true)
      setListeningDuration(0)

      // Start timer for listening duration
      if (listeningTimerRef.current) {
        clearInterval(listeningTimerRef.current)
      }

      listeningTimerRef.current = setInterval(() => {
        setListeningDuration((prev) => prev + 1)
      }, 1000)
    }

    recognitionRef.current.onresult = (event: any) => {
      // Skip processing if muted or speaking
      if (isMuted || isSpeaking) return

      lastSpeechRef.current = Date.now()

      // Get the transcript
      let finalTranscript = ""
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      const transcript = finalTranscript || interimTranscript
      setTranscription(transcript)

      // Reset silence detection timer
      if (silenceTimer) {
        clearTimeout(silenceTimer)
      }

      // Set a new silence detection timer
      const timer = setTimeout(() => {
        if (transcript.trim() && Date.now() - lastSpeechRef.current >= 1500 && !isMuted && !isSpeaking) {
          stopRecognition()
          handleSendVoice(transcript)
        }
      }, 1500)

      setSilenceTimer(timer)
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)

      if (event.error !== "no-speech") {
        toast({
          title: "Speech Recognition Error",
          description: `An error occurred: ${event.error}`,
          variant: "destructive",
        })
      }

      setIsListening(false)

      // Try to restart after an error
      if (isActive && !isMuted && !isProcessing && !isSpeaking) {
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current)
        }

        restartTimeoutRef.current = setTimeout(() => {
          setupAndStartRecognition()
        }, 1000)
      }
    }

    recognitionRef.current.onend = () => {
      console.log("Speech recognition ended")
      setIsListening(false)

      if (listeningTimerRef.current) {
        clearInterval(listeningTimerRef.current)
        listeningTimerRef.current = null
      }

      // Try to restart if it ended unexpectedly and we're not speaking
      if (isActive && !isMuted && !isProcessing && !isSpeaking) {
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current)
        }

        restartTimeoutRef.current = setTimeout(() => {
          setupAndStartRecognition()
        }, 1000)
      }
    }

    // Start recognition
    try {
      console.log("Starting speech recognition")
      recognitionRef.current.start()
    } catch (error) {
      console.error("Error starting speech recognition:", error)

      // If already started, just update state
      if (error instanceof Error && error.message.includes("already started")) {
        setIsListening(true)
      } else {
        // Try again after a delay
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current)
        }

        restartTimeoutRef.current = setTimeout(() => {
          setupAndStartRecognition()
        }, 1000)
      }
    }
  }

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try {
        // Remove event handlers to prevent callbacks
        const tempRecognition = recognitionRef.current
        recognitionRef.current = null

        tempRecognition.onend = null
        tempRecognition.onstart = null
        tempRecognition.onerror = null
        tempRecognition.onresult = null

        tempRecognition.stop()
        console.log("Speech recognition stopped")
      } catch (e) {
        console.error("Error stopping speech recognition:", e)
      }
    }

    setIsListening(false)

    if (listeningTimerRef.current) {
      clearInterval(listeningTimerRef.current)
      listeningTimerRef.current = null
    }

    if (silenceTimer) {
      clearTimeout(silenceTimer)
      setSilenceTimer(null)
    }
  }

  const cleanupSpeechRecognition = () => {
    stopRecognition()

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }
  }

  // Generate audio visualization when speaking
  useEffect(() => {
    if (isSpeaking) {
      const generateVisualization = () => {
        const newVisualization = Array.from({ length: 50 }, () => Math.random() * 50 + 10)
        setAudioVisualization(newVisualization)
        animationFrameRef.current = requestAnimationFrame(generateVisualization)
      }

      generateVisualization()

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    } else {
      setAudioVisualization([])
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isSpeaking])

  const handleSendVoice = async (text: string) => {
    if (!text.trim() || !isActive) return

    setIsProcessing(true)
    const currentText = text.trim()

    // Add user message to conversation immediately
    setConversationHistory((prev) => [...prev, { role: "user", content: currentText }])

    // Clear transcription
    setTranscription("")

    try {
      // Use the updated API function
      const data = await sendConversationMessage(currentText, conversationId)

      // Add assistant response to conversation
      setConversationHistory((prev) => [...prev, { role: "assistant", content: data.text }])

      setConversationId(data.conversationId)

      // Only proceed with audio if not muted
      if (!isMuted && isActive) {
        try {
          // Stop any currently playing audio
          if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ""
          }

          // Get streaming audio URL
          const { audioUrl: newAudioUrl } = await synthesizeSpeech(data.text, "")
          setAudioUrl(newAudioUrl)

          // Play the audio automatically
          if (audioRef.current) {
            // Set up event listeners
            audioRef.current.onplay = () => {
              setIsSpeaking(true)
              console.log("Audio started playing")
              // Explicitly stop recognition when audio starts playing
              stopRecognition()
            }

            audioRef.current.onended = handleAudioEnded
            audioRef.current.onerror = (e) => {
              console.error("Audio playback error:", e)
              setIsSpeaking(false)
              handleAudioEnded()
            }

            // Create a new audio element each time to avoid state issues
            audioRef.current.src = newAudioUrl

            // Start playback
            const playPromise = audioRef.current.play()

            // Handle play promise (required for some browsers)
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("Audio playback started successfully")
                })
                .catch((err) => {
                  console.error("Audio playback failed:", err)
                  setIsSpeaking(false)
                  handleAudioEnded()
                })
            }
          }
        } catch (audioError) {
          console.error("Error with audio playback:", audioError)
          setIsSpeaking(false)

          // If there's an error with audio, still restart listening
          setTimeout(() => {
            if (isActive && !isMuted) {
              setupAndStartRecognition()
            }
          }, 1000)
        }
      } else {
        // If muted, don't play audio but still restart listening if needed
        console.log("Audio muted, skipping playback")
        setTimeout(() => {
          if (isActive && !isMuted) {
            setupAndStartRecognition()
          }
        }, 1000)
      }
    } catch (error: any) {
      console.error("Conversation error:", error)
      toast({
        title: "Conversation Error",
        description: `Failed to get response: ${error.message}`,
        variant: "destructive",
      })

      // Restart listening if there was an error and we're still active
      if (isActive && !isMuted) {
        setTimeout(() => {
          setupAndStartRecognition()
        }, 1000)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAudioEnded = () => {
    console.log("Audio playback ended")
    setIsSpeaking(false)

    // Auto-start listening again after AI finishes speaking if we're still active
    if (isActive && !isMuted) {
      // Add a delay before restarting recognition to prevent feedback
      setTimeout(() => {
        setupAndStartRecognition()
      }, 1000)
    }
  }

  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)

    if (newMutedState) {
      // Muting
      toast({
        title: "Microphone Muted",
        description: "The system will not listen to your voice until unmuted.",
      })

      // Stop listening immediately
      stopRecognition()

      // Also stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        setIsSpeaking(false)
      }
    } else {
      // Unmuting
      toast({
        title: "Microphone Unmuted",
        description: "The system will now listen to your voice.",
      })

      // Start listening after a short delay if not speaking
      if (!isSpeaking) {
        setTimeout(() => {
          setupAndStartRecognition()
        }, 500)
      }
    }
  }

  // Function to handle ending the call
  const handleEndCall = () => {
    setIsActive(false)
    cleanupSpeechRecognition()

    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      setIsSpeaking(false)
    }

    // Call the parent component's onEndCall if provided
    if (onEndCall) {
      onEndCall()
    }
  }

  return (
    <div className="p-6">
      {/* Title (only shown when conversation is active) */}
      {conversationHistory.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">AI Voice Conversation</h1>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {isActive && (
          <>
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full",
                isMuted
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300"
                  : isListening
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    : isProcessing
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                      : isSpeaking
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
              )}
            >
              {isMuted && (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span>Microphone Muted</span>
                </>
              )}
              {!isMuted && isListening && (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Listening... {formatTime(listeningDuration)}</span>
                </>
              )}
              {isProcessing && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              )}
              {isSpeaking && (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>AI Speaking...</span>
                </>
              )}
              {!isMuted && !isListening && !isProcessing && !isSpeaking && (
                <>
                  <div className="h-2 w-2 rounded-full bg-slate-500"></div>
                  <span>Idle</span>
                </>
              )}
            </div>

            <button
              onClick={toggleMute}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-white",
                isMuted ? "bg-orange-500 hover:bg-orange-600" : "bg-red-500 hover:bg-red-600",
              )}
            >
              {isMuted ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              <span>{isMuted ? "Unmute" : "Mute"}</span>
            </button>
          </>
        )}
      </div>

      {/* Transcription Display */}
      {transcription && isActive && !isMuted && (
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-lg mb-6">
          <p className="font-medium mb-1 text-slate-700 dark:text-slate-300">Current transcription:</p>
          <p className="italic text-slate-600 dark:text-slate-400">{transcription}</p>
        </div>
      )}

      {/* Conversation History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mb-6 h-[300px] overflow-y-auto">
        {conversationHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
            <p className="mb-2">Your conversation will appear here.</p>
            <p className="text-sm">
              {isMuted ? "Unmute your microphone to start speaking" : "Start speaking to begin..."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversationHistory.map((message, index) => (
              <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>
        )}
      </div>

      {/* Audio Visualization (simplified) */}
      {isSpeaking && (
        <div className="h-12 w-full flex items-center justify-center gap-[2px] bg-slate-100 dark:bg-slate-800/60 rounded-lg overflow-hidden">
          {audioVisualization.map((height, index) => (
            <div key={index} className="w-1 bg-blue-500 rounded-full" style={{ height: `${height}%` }} />
          ))}
        </div>
      )}

      {/* Audio element */}
      <audio ref={audioRef} onEnded={handleAudioEnded} preload="auto" />
    </div>
  )
}

