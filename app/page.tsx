"use client"

import Image from "next/image"
import { Upload, Volume2, Wand2, Zap } from "lucide-react"
import UploadForm from "@/components/upload-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <motion.div
      className="min-h-screen transition-colors duration-300 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="noise"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.08)_0%,_transparent_50%)] animate-gradient"></div>
      </div>

      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-md transition-all duration-300">
        <div className="container flex h-16 items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Icon-swk7WBmbgmNpfLAhcW7L0zgvSEnqeu.png"
                alt="FINOVA Logo"
                width={40}
                height={40}
                className="h-10 w-auto transition-transform hover:scale-105"
                style={{ objectFit: "contain" }}
              />
            </div>
          </motion.div>
          <motion.nav
            className="flex items-center gap-6"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              How It Works
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <ThemeToggle />
          </motion.nav>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <motion.section
          className="py-8 md:py-12 lg:py-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mx-auto max-w-4xl text-center relative">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse-custom"></div>
            <motion.h1
              className="animate-fade-up text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl gradient-text"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2, type: "spring" }}
            >
              Transform Voice to Text to Voice with AI
            </motion.h1>
            <motion.p
              className="mt-6 text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Upload voice recordings, get AI-powered text responses, and convert them back to natural speech.
            </motion.p>
            <motion.div
              className="mt-8 flex justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 button-hover"
              >
                <Zap className="mr-2 h-4 w-4" />
                Explore Features
              </a>
            </motion.div>
          </div>

          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
          >
            <UploadForm />
          </motion.div>
        </motion.section>

        <motion.section
          id="features"
          className="py-16 md:py-20 relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="absolute -top-40 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl opacity-70 animate-float"></div>
          <motion.h2
            className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-16 gradient-text"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            Key Features
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="group rounded-xl border p-6 shadow-sm card-hover bg-card/80 backdrop-blur-sm"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit transition-transform group-hover:scale-110 duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full animate-pulse-custom"></div>
                <Upload className="h-6 w-6 text-primary relative z-10" />
              </div>
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">Voice Upload</h3>
              <p className="mt-2 text-muted-foreground">
                Upload voice recordings in various formats for AI processing.
              </p>
            </motion.div>

            <motion.div
              className="group rounded-xl border p-6 shadow-sm card-hover bg-card/80 backdrop-blur-sm"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit transition-transform group-hover:scale-110 duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full animate-pulse-custom"></div>
                <Wand2 className="h-6 w-6 text-primary relative z-10" />
              </div>
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">AI Processing</h3>
              <p className="mt-2 text-muted-foreground">
                Powered by AI for accurate voice-to-text conversion.
              </p>
            </motion.div>

            <motion.div
              className="group rounded-xl border p-6 shadow-sm card-hover bg-card/80 backdrop-blur-sm"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit transition-transform group-hover:scale-110 duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full animate-pulse-custom"></div>
                <Volume2 className="h-6 w-6 text-primary relative z-10" />
              </div>
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">Voice Synthesis</h3>
              <p className="mt-2 text-muted-foreground">
                Convert AI responses back to natural-sounding speech.
              </p>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          id="how-it-works"
          className="py-16 md:py-20 relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div
            className="absolute -top-20 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-70 animate-float"
            style={{ animationDelay: "1s" }}
          ></div>
          <motion.h2
            className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-16 gradient-text"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            How It Works
          </motion.h2>

          <div className="relative">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/30 via-primary/50 to-primary/30 animate-pulse-custom"></div>

            <div className="relative grid gap-8 md:grid-cols-2">
              <motion.div
                className="flex flex-col items-end md:text-right"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="mb-2 flex items-center">
                  <motion.div
                    className="relative z-10 rounded-full bg-background p-1 text-primary ring-2 ring-primary/50 shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary animate-pulse-custom">
                      <span className="text-sm font-bold text-primary-foreground">1</span>
                    </div>
                  </motion.div>
                </div>
                <motion.div
                  className="rounded-lg border bg-card/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-card"
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <h3 className="text-xl font-bold">Upload Voice</h3>
                  <p className="mt-2 text-muted-foreground">
                    Upload your voice recording through our intuitive interface.
                  </p>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex flex-col items-start md:pt-16"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="mb-2 flex items-center">
                  <motion.div
                    className="relative z-10 rounded-full bg-background p-1 text-primary ring-2 ring-primary/50 shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary animate-pulse-custom"
                      style={{ animationDelay: "0.2s" }}
                    >
                      <span className="text-sm font-bold text-primary-foreground">2</span>
                    </div>
                  </motion.div>
                </div>
                <motion.div
                  className="rounded-lg border bg-card/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-card"
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <h3 className="text-xl font-bold">AI Processing</h3>
                  <p className="mt-2 text-muted-foreground">
                    AI processes your voice and generates a text response.
                  </p>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex flex-col items-end md:text-right"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="mb-2 flex items-center">
                  <motion.div
                    className="relative z-10 rounded-full bg-background p-1 text-primary ring-2 ring-primary/50 shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary animate-pulse-custom"
                      style={{ animationDelay: "0.4s" }}
                    >
                      <span className="text-sm font-bold text-primary-foreground">3</span>
                    </div>
                  </motion.div>
                </div>
                <motion.div
                  className="rounded-lg border bg-card/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-card"
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <h3 className="text-xl font-bold">Text Response</h3>
                  <p className="mt-2 text-muted-foreground">View the AI-generated text response to your voice input.</p>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex flex-col items-start md:pt-16"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <div className="mb-2 flex items-center">
                  <motion.div
                    className="relative z-10 rounded-full bg-background p-1 text-primary ring-2 ring-primary/50 shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary animate-pulse-custom"
                      style={{ animationDelay: "0.6s" }}
                    >
                      <span className="text-sm font-bold text-primary-foreground">4</span>
                    </div>
                  </motion.div>
                </div>
                <motion.div
                  className="rounded-lg border bg-card/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-card"
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <h3 className="text-xl font-bold">Voice Synthesis</h3>
                  <p className="mt-2 text-muted-foreground">
                    Convert the text response back to natural speech.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </main>

      <motion.footer
        className="border-t bg-muted/40 transition-colors duration-300 relative overflow-hidden mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none"></div>
        <div className="container flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Icon-swk7WBmbgmNpfLAhcW7L0zgvSEnqeu.png"
                alt="FINOVA Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
                style={{ objectFit: "contain" }}
              />
            </div>
            <span className="text-lg font-semibold">FINOVA</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 FINOVA. All rights reserved.</p>
        </div>
      </motion.footer>
    </motion.div>
  )
}