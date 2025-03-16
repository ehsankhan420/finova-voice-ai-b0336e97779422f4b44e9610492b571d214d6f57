"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2, Loader2, VolumeX } from "lucide-react"
import { createSpeechRecognition } from "@/lib/speech-recognition"
import { synthesizeSpeech, sendConversationMessage, type Message } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { cn, formatTime, isSpeechRecognitionSupported } from "@/lib/utils"

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
  const [keepAliveInterval, setKeepAliveInterval] = useState<NodeJS.Timeout | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const listeningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpeechRef = useRef<number>(Date.now())
  const conversationEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversationHistory])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && isActive) {
      setupSpeechRecognition()

      // Set up a keep-alive interval to prevent the page from going idle
      const interval = setInterval(() => {
        if (!isListening && !isProcessing && !isSpeaking && isActive && !isMuted) {
          console.log("Keep-alive: restarting speech recognition")
          restartSpeechRecognition()
        }
      }, 30000) // Check every 30 seconds

      setKeepAliveInterval(interval)
    }

    return () => {
      cleanupSpeechRecognition()
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval)
      }
    }
  }, [isActive])

  const setupSpeechRecognition = () => {
    if (!isActive) return

    recognitionRef.current = createSpeechRecognition()

    if (recognitionRef.current) {
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setListeningDuration(0)

        // Start timer for listening duration
        listeningTimerRef.current = setInterval(() => {
          setListeningDuration((prev) => prev + 1)
        }, 1000)
      }

      recognitionRef.current.onresult = (event: any) => {
        // Skip processing if muted
        if (isMuted) return

        lastSpeechRef.current = Date.now()

        // Get the final transcript from the results
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }

        // Use the final transcript if available, otherwise use the interim
        const transcript = finalTranscript || interimTranscript
        setTranscription(transcript)

        // Reset silence detection timer
        if (silenceTimer) {
          clearTimeout(silenceTimer)
        }

        // Set a new silence detection timer
        const timer = setTimeout(() => {
          // If we've been silent for 1.5 seconds and have a transcript, send the message
          if (transcript.trim() && Date.now() - lastSpeechRef.current >= 1500 && !isMuted) {
            stopListening()
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
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        if (listeningTimerRef.current) {
          clearInterval(listeningTimerRef.current)
          listeningTimerRef.current = null
        }

        // Restart recognition if it stopped unexpectedly and we're still active
        if (isActive && !isProcessing && !isSpeaking && !isMuted) {
          try {
            setTimeout(() => {
              restartSpeechRecognition()
            }, 1000)
          } catch (e) {
            // Ignore errors when restarting
          }
        }
      }
    }
  }

  const restartSpeechRecognition = () => {
    if (!isActive || isMuted) return

    try {
      if (recognitionRef.current) {
        // Check if recognition is already running
        if (isListening) {
          console.log("Recognition is already running, no need to restart")
          return
        }

        // Make sure to stop it first to avoid errors
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
          console.log("Error stopping recognition before restart:", e)
        }
      }

      // Wait a moment before starting again
      setTimeout(() => {
        if (recognitionRef.current && isActive && !isMuted && !isListening) {
          try {
            recognitionRef.current.start()
            console.log("Speech recognition restarted successfully")
          } catch (e) {
            console.error("Error starting recognition in restart:", e)
          }
        }
      }, 300)
    } catch (e) {
      console.error("Error in restartSpeechRecognition:", e)
    }
  }

  const cleanupSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore errors when stopping
      }
    }

    if (listeningTimerRef.current) {
      clearInterval(listeningTimerRef.current)
    }

    if (silenceTimer) {
      clearTimeout(silenceTimer)
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

  // Auto-start listening when component mounts
  useEffect(() => {
    if (isActive && isSpeechRecognitionSupported() && !isMuted) {
      startListening()
    }

    return () => {
      stopListening()
    }
  }, [isActive, isMuted])

  const startListening = () => {
    if (!isActive || isMuted) return

    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Speech Recognition Error",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      })
      return
    }

    if (!recognitionRef.current) {
      setupSpeechRecognition()
    }

    try {
      // Check if recognition is already running
      if (isListening) {
        console.log("Recognition is already running, not starting again")
        return
      }

      recognitionRef.current.start()
      lastSpeechRef.current = Date.now()
      setTranscription("")
    } catch (error: any) {
      console.error("Error starting speech recognition:", error)

      // If the error is "recognition has already started", update the state
      if (error.message && error.message.includes("already started")) {
        setIsListening(true)
      } else {
        toast({
          title: "Speech Recognition Error",
          description: `Failed to start: ${error.message}`,
          variant: "destructive",
        })
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore errors when stopping
      }

      if (listeningTimerRef.current) {
        clearInterval(listeningTimerRef.current)
        listeningTimerRef.current = null
      }

      if (silenceTimer) {
        clearTimeout(silenceTimer)
        setSilenceTimer(null)
      }
    }
  }

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

      // Synthesize speech with ElevenLabs
      try {
        const { audioUrl: newAudioUrl } = await synthesizeSpeech(data.text, "")
        setAudioUrl(newAudioUrl)

        // Play the audio automatically
        setTimeout(() => {
          if (audioRef.current && isActive) {
            // Set up event listeners
            audioRef.current.onplay = () => {
              setIsSpeaking(true)
              console.log("Audio started playing")
            }

            audioRef.current.onended = handleAudioEnded

            audioRef.current.onerror = (e) => {
              console.error("Audio playback error:", e)
              setIsSpeaking(false)
              handleAudioEnded()
            }

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
        }, 100)
      } catch (audioError) {
        console.error("Error with ElevenLabs:", audioError)
        setIsSpeaking(false)

        // If there's an error with audio, still restart listening
        setTimeout(() => {
          if (isActive && !isMuted) {
            startListening()
          }
        }, 500)
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
        startListening()
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
      setTimeout(() => {
        startListening()
      }, 500)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)

    if (isMuted) {
      // Unmuting
      toast({
        title: "Microphone Unmuted",
        description: "The system will now listen to your voice.",
      })
      startListening()
    } else {
      // Muting
      toast({
        title: "Microphone Muted",
        description: "The system will not listen to your voice until unmuted.",
      })
      stopListening()
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
              Idle
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
              className="w-1.5 bg-gradient-to-t from-primary/40 to-primary rounded-full"
              initial={{ height: "10%" }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </motion.div>
      )}

      {/* Audio element */}
      <audio ref={audioRef} src={audioUrl || ""} onEnded={handleAudioEnded} preload="auto" />
    </div>
  )
}

