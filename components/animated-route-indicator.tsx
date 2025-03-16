"use client"

import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function AnimatedRouteIndicator() {
  const pathname = usePathname()
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    setIsChanging(true)
    const timeout = setTimeout(() => setIsChanging(false), 1000)
    return () => clearTimeout(timeout)
  }, [])

  if (!isChanging) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 1.5, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1, 0] }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="w-24 h-24 rounded-full bg-primary/40 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-primary/60 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-8 h-8 rounded-full bg-primary"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

