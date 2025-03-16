"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2, Loader2, VolumeX } from "lucide-react"
import { createSpeechRecognition } from "@/lib/speech-recognition"
import { synthesizeSpeech, sendConversationMessage, type Message } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
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
      const data = await sendConversationMessage(currentText, conversationId, conversationHistory)

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
    <div className="space-y-6">
      {/* Status Indicator */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div
          className={cn(
            "px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium",
            !isActive
              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              : isMuted
                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                : isListening
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : isSpeaking
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : isProcessing
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
          )}
        >
          {!isActive && (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              Call Ended
            </>
          )}
          {isActive && isMuted && (
            <>
              <VolumeX className="h-4 w-4 text-orange-500" />
              Microphone Muted
            </>
          )}
          {isActive && !isMuted && isListening && (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Listening... {formatTime(listeningDuration)}
            </>
          )}
          {isActive && isSpeaking && (
            <>
              <Volume2 className="h-4 w-4 text-blue-500" />
              AI Speaking...
            </>
          )}
          {isActive && isProcessing && (
            <>
              <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
              Processing...
            </>
          )}
          {isActive && !isMuted && !isListening && !isSpeaking && !isProcessing && (
            <>
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              <span>Idle</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6 px-2 text-xs"
                onClick={() => setupAndStartRecognition()}
              >
                Restart
              </Button>
            </>
          )}
        </div>

        {isActive && (
          <Button
            variant={isMuted ? "default" : isListening ? "destructive" : "outline"}
            size="sm"
            onClick={toggleMute}
            disabled={isProcessing}
            className={cn(
              "transition-colors",
              isMuted ? "bg-orange-600 hover:bg-orange-700" : isListening && "animate-pulse",
            )}
          >
            {isMuted ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
            {isMuted ? "Unmute" : "Mute"}
          </Button>
        )}
      </div>

      {/* Transcription Display */}
      {transcription && isActive && !isMuted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/30 p-4 rounded-lg text-sm"
        >
          <p className="font-medium mb-1">Current transcription:</p>
          <p className="italic">{transcription}</p>
        </motion.div>
      )}

      {/* Conversation History */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto p-2 rounded-lg border bg-card/50 backdrop-blur-sm">
        <AnimatePresence initial={false}>
          {conversationHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your conversation will appear here.</p>
              <p className="text-sm mt-2">
                {isMuted ? "Unmute your microphone to start speaking" : "Start speaking to begin..."}
              </p>
            </div>
          ) : (
            conversationHistory.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {message.content}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        {/* Invisible element to scroll to */}
        <div ref={conversationEndRef} />
      </div>

      {/* Audio Visualization */}
      {isSpeaking && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="h-16 w-full flex items-center justify-center gap-[2px] p-2 bg-muted/30 rounded-lg overflow-hidden"
        >
          {audioVisualization.map((height, index) => (
            <motion.div
              key={index}
              className="w-1.5 bg-gradient-to-t from-primary/40 to-primary rounded-full audio-bar"
              style={
                {
                  "--random-height": `${height}%`,
                  "--index": index,
                } as React.CSSProperties
              }
              initial={{ height: "10%" }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </motion.div>
      )}

      {/* Audio element */}
      <audio ref={audioRef} onEnded={handleAudioEnded} preload="auto" />
    </div>
  )
}

