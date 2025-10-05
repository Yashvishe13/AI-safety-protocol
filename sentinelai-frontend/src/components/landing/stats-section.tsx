"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Users, Shield, Clock, Zap, TrendingUp, Award } from "lucide-react";

export function StatsSection() {
  const stats = [
    {
      id: 1,
      icon: Users,
      number: "500+",
      label: "Companies Protected",
      description: "From startups to Fortune 500 enterprises trust SentinelAI",
      gradient: "from-blue-500 to-cyan-500",
      glow: "shadow-blue-500/25",
    },
    {
      id: 2,
      icon: Shield,
      number: "10M+",
      label: "Threats Blocked",
      description: "Malicious attacks prevented across all our customers",
      gradient: "from-green-500 to-emerald-500",
      glow: "shadow-green-500/25",
    },
    {
      id: 3,
      icon: TrendingUp,
      number: "99.9%",
      label: "Uptime SLA",
      description: "Always-on protection with enterprise-grade reliability",
      gradient: "from-purple-500 to-pink-500",
      glow: "shadow-purple-500/25",
    },
    {
      id: 4,
      icon: Zap,
      number: "<50ms",
      label: "Average Latency",
      description: "Lightning-fast security checks that don't slow you down",
      gradient: "from-orange-500 to-red-500",
      glow: "shadow-orange-500/25",
    },
  ];

  const achievements = [
    {
      title: "Industry Recognition",
      items: [
        "Featured in Gartner Magic Quadrant",
        "RSA Innovation Sandbox Winner",
        "TechCrunch Disrupt Finalist",
      ],
    },
    {
      title: "Security Certifications",
      items: [
        "SOC 2 Type II Compliant",
        "ISO 27001 Certified",
        "GDPR & CCPA Ready",
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="py-20 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            className="w-full h-full"
          >
            <defs>
              <pattern
                id="grid"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 60 0 L 0 0 0 60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Trusted by the{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Best in AI
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Join thousands of companies already protecting their AI applications
            with enterprise-grade security
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {stats.map((stat) => (
            <motion.div key={stat.id} variants={cardVariants}>
              <Card
                className={`p-8 bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 group hover:scale-105 hover:${stat.glow} hover:shadow-2xl`}
              >
                <div className="text-center space-y-4">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Number */}
                  <motion.div
                    className={`text-4xl lg:text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    {stat.number}
                  </motion.div>

                  {/* Label */}
                  <div className="text-xl font-semibold text-white">
                    {stat.label}
                  </div>

                  {/* Description */}
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {achievements.map((achievement, index) => (
            <Card
              key={index}
              className="p-8 bg-slate-800/30 border-slate-700/50 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4 mb-6">
                <Award className="w-8 h-8 text-yellow-400" />
                <h3 className="text-2xl font-bold text-white">
                  {achievement.title}
                </h3>
              </div>

              <div className="space-y-3">
                {achievement.items.map((item, itemIndex) => (
                  <motion.div
                    key={itemIndex}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: itemIndex * 0.1 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400"></div>
                    <span className="text-slate-300">{item}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Bottom Quote */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Card className="p-8 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm max-w-4xl mx-auto">
            <div className="text-2xl font-semibold text-white mb-4">
              &quot;SentinelAI has been game-changing for our AI security.
              We&apos;ve blocked over 10,000 threats in the past month
              alone.&quot;
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                SM
              </div>
              <div className="text-left">
                <div className="text-slate-300 font-medium">Sarah Mitchell</div>
                <div className="text-slate-500 text-sm">
                  CISO, TechCorp Industries
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
