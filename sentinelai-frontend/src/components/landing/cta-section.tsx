"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Clock,
  Phone,
  Zap,
} from "lucide-react";
import Link from "next/link";

export function CTASection() {
  const trustSignals = [
    { icon: Users, text: "500+ Companies Trust Us", color: "text-blue-400" },
    { icon: Shield, text: "99.9% Uptime SLA", color: "text-green-400" },
    { icon: Zap, text: "<50ms Response Time", color: "text-purple-400" },
    { icon: Clock, text: "5min Setup Time", color: "text-orange-400" },
  ];

  const floatingElements = [
    { id: 1, size: "w-20 h-20", position: "top-1/4 left-[10%]", delay: 0 },
    { id: 2, size: "w-16 h-16", position: "top-1/3 right-[15%]", delay: 0.5 },
    { id: 3, size: "w-24 h-24", position: "bottom-1/4 left-[20%]", delay: 1 },
    {
      id: 4,
      size: "w-18 h-18",
      position: "bottom-1/3 right-[10%]",
      delay: 1.5,
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden bg-black dark:bg-black">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            className="w-full h-full"
          >
            <defs>
              <pattern
                id="ctaGrid"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 100 0 L 0 0 0 100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ctaGrid)" />
          </svg>
        </div>
      </div>

      {/* Floating Geometric Shapes */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className={`absolute ${element.size} ${element.position} opacity-20`}
          initial={{ y: 0, rotate: 0 }}
          animate={{
            y: [-10, 10, -10],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 6,
            delay: element.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-400 rounded-full blur-sm" />
        </motion.div>
      ))}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Main CTA Content */}
          <motion.div
            className="text-center space-y-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <Badge className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border-white/20 px-6 py-2">
              <Shield className="w-4 h-4" />
              Join 500+ Protected Companies
            </Badge>

            {/* Headline */}
            <h2 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
              Ready to Secure{" "}
              <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                Your AI?
              </span>
            </h2>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
              Join 500+ companies protecting their AI applications with
              SentinelAI&apos;s enterprise-grade security platform
            </p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Start Free 14-Day Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-4 text-lg"
              >
                <Phone className="mr-2 w-5 h-5" />
                Talk to Sales
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="pt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <p className="text-purple-200 text-sm mb-6">
                Trusted by leading companies worldwide
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {trustSignals.map((signal, index) => (
                  <motion.div
                    key={index}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  >
                    <signal.icon className={`w-6 h-6 ${signal.color}`} />
                    <span className="text-white text-sm font-medium text-center">
                      {signal.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom Features Strip */}
          <motion.div
            className="mt-16 pt-8 border-t border-white/20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
                <h4 className="text-white font-semibold">
                  No Credit Card Required
                </h4>
                <p className="text-purple-200 text-sm">
                  Start your free trial instantly without any payment details
                </p>
              </div>

              <div className="space-y-2">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
                <h4 className="text-white font-semibold">5-Minute Setup</h4>
                <p className="text-purple-200 text-sm">
                  Get enterprise-grade AI security running in minutes, not days
                </p>
              </div>

              <div className="space-y-2">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
                <h4 className="text-white font-semibold">
                  24/7 Expert Support
                </h4>
                <p className="text-purple-200 text-sm">
                  Our security experts are here to help you succeed
                </p>
              </div>
            </div>
          </motion.div>

          {/* Final Trust Boost */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <div className="flex -space-x-2">
                {["🧑‍💻", "👩‍💼", "👨‍🔬", "👩‍🚀"].map((emoji, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-purple-600"
                  >
                    <span className="text-sm">{emoji}</span>
                  </div>
                ))}
              </div>
              <span className="text-white text-sm font-medium">
                10,000+ developers already secured
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
