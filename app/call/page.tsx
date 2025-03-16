"use client"

import { useState, useEffect } from "react"
import { VoiceCall } from "@/components/voice-call"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, PhoneOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { isSpeechRecognitionSupported, formatTime } from "@/lib/utils"

export default function CallPage() {
  const router = useRouter()
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isSupported, setIsSupported] = useState(true)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== "undefined") {
      setIsSupported(isSpeechRecognitionSupported())
    }

    // Cleanup on component unmount
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [])

  useEffect(() => {
    if (isCallActive) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
      setTimerInterval(interval)

      return () => {
        clearInterval(interval)
      }
    } else if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }, [isCallActive])

  const startCall = () => {
    if (!isSupported) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome or Edge.",
        variant: "destructive",
      })
      return
    }

    setIsCallActive(true)
    setCallDuration(0)
    toast({
      title: "Call Started",
      description: "You can now speak with the AI assistant. Just start talking!",
    })
  }

  const endCall = () => {
    setIsCallActive(false)
    toast({
      title: "Call Ended",
      description: `Call duration: ${formatTime(callDuration)}`,
    })
  }

  return (
    <motion.div
      className="container py-8 md:py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>

          <div className="flex items-center gap-4">
            {isCallActive ? (
              <>
                <span className="text-sm font-medium animate-pulse-custom">
                  Call in progress: {formatTime(callDuration)}
                </span>
                <Button variant="destructive" onClick={endCall} className="flex items-center gap-2">
                  <PhoneOff className="h-4 w-4" />
                  End Call
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                onClick={startCall}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:opacity-90 transition-opacity"
              >
                <Phone className="h-4 w-4" />
                Start Call
              </Button>
            )}
          </div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card/80 backdrop-blur-sm border-2 rounded-xl p-6 shadow-lg"
        >
          <h1 className="text-2xl font-bold mb-6 gradient-text">AI Voice Conversation</h1>

          {!isSupported && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg mb-6">
              <p>Your browser doesn't support speech recognition. Please use Chrome or Edge for the best experience.</p>
            </div>
          )}

          {isCallActive ? (
            <VoiceCall onEndCall={endCall} />
          ) : (
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Phone className="h-12 w-12 text-primary" />
                </div>
              </motion.div>
              <h2 className="text-xl font-semibold mb-2">Ready to Start a Conversation</h2>
              <p className="text-muted-foreground mb-6">
                Click the Start Call button to begin talking with the AI assistant. The system will automatically listen
                to you and respond.
              </p>
              <div className="space-y-4">
                <Button onClick={startCall} className="bg-gradient-to-r from-green-600 to-emerald-500 hover:opacity-90">
                  <Phone className="h-4 w-4 mr-2" />
                  Start Call
                </Button>

                <div className="text-sm text-muted-foreground mt-6">
                  <h3 className="font-medium mb-2">How it works:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Start speaking after the call begins</li>
                    <li>The system will detect when you pause</li>
                    <li>AI will automatically respond with voice</li>
                    <li>The conversation continues naturally</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <Toaster />
    </motion.div>
  )
}

