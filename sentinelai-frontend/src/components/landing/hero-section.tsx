"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black dark:bg-black">
      {/* Enhanced Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 opacity-95" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />

      {/* Additional Modern Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-purple-900/10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-blue-600/30 via-purple-600/20 to-transparent blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-radial from-purple-600/30 via-indigo-600/20 to-transparent blur-3xl rounded-full" />

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />

      {/* Radial gradient for depth */}
      <div className="absolute inset-0 bg-radial-gradient from-white/5 via-transparent to-transparent" />

      {/* Animated Light Streaks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Light streak 1 */}
        <motion.div
          className="absolute top-1/4 left-0 w-2 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-60"
          animate={{
            x: ["-100px", "calc(100vw + 100px)"],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: Math.random() * 4 + 2,
            ease: "linear",
          }}
        />

        {/* Light streak 2 */}
        <motion.div
          className="absolute top-1/2 left-0 w-3 h-0.5 bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-40"
          animate={{
            x: ["-150px", "calc(100vw + 150px)"],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: Math.random() * 6 + 1,
            ease: "linear",
            delay: 1,
          }}
        />

        {/* Light streak 3 */}
        <motion.div
          className="absolute top-3/4 left-0 w-1.5 h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-50"
          animate={{
            x: ["-80px", "calc(100vw + 80px)"],
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: Math.random() * 5 + 3,
            ease: "linear",
            delay: 2,
          }}
        />

        {/* Additional random streaks */}
        <motion.div
          className="absolute top-1/3 left-0 w-2.5 h-0.5 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-45"
          animate={{
            x: ["-120px", "calc(100vw + 120px)"],
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            repeatDelay: Math.random() * 7 + 2,
            ease: "linear",
            delay: 0.5,
          }}
        />

        <motion.div
          className="absolute top-2/3 left-0 w-1 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-35"
          animate={{
            x: ["-60px", "calc(100vw + 60px)"],
            opacity: [0, 0.5, 0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: Math.random() * 4 + 4,
            ease: "linear",
            delay: 3,
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading with Enhanced Gradient */}
          <motion.div
            className="relative mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Multiple gradient layers for depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 blur-3xl" />

            <h1 className="relative text-6xl lg:text-8xl font-bold leading-tight">
              <span className="text-white">Next-Gen</span>
              <br />
              <span className="bg-gradient-to-r from-gray-100 via-white to-gray-200 bg-clip-text text-transparent font-black">
                AI Security
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Advanced AI-powered threat detection and response platform. Protect
            your infrastructure with intelligent security automation.
          </motion.p>

          {/* Get Started Button */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-100 font-semibold px-8 py-4 text-lg shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Powered By Section */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <p className="text-sm text-gray-400 mb-6 font-medium tracking-wider uppercase">
              Powered by
            </p>
            <div className="flex justify-center items-center gap-4">
              <motion.div
                className="group relative px-6 py-3 bg-gradient-to-r from-white/8 to-white/4 rounded-lg border border-white/15 backdrop-blur-sm hover:from-white/12 hover:to-white/8 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/15 to-orange-500/15 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative text-white font-semibold text-base tracking-wide">
                  Cerebras
                </span>
              </motion.div>

              <div className="text-gray-500 text-lg font-light mx-2">+</div>

              <motion.div
                className="group relative px-6 py-3 bg-gradient-to-r from-white/8 to-white/4 rounded-lg border border-white/15 backdrop-blur-sm hover:from-white/12 hover:to-white/8 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative text-white font-semibold text-base tracking-wide">
                  Meta
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
