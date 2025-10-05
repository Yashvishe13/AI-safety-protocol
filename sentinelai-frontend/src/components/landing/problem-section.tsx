"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  Globe,
  TrendingUp,
  Users,
  Building,
  DollarSign,
  Clock,
} from "lucide-react";

export function ProblemSection() {
  const breachStories = [
    {
      id: 1,
      location: { top: "20%", left: "15%" },
      region: "North America",
      incident: "Data Leak",
      description: "$15M Fine",
    },
    {
      id: 2,
      location: { top: "35%", left: "45%" },
      region: "Europe",
      incident: "Code Injection",
      description: "3M Undetected",
    },
    {
      id: 3,
      location: { top: "45%", left: "70%" },
      region: "Asia",
      incident: "Prompt Attack",
      description: "Safety Bypassed",
    },
    {
      id: 4,
      location: { top: "60%", left: "25%" },
      region: "South America",
      incident: "Agent Exploit",
      description: "$500K Loss",
    },
    {
      id: 5,
      location: { top: "70%", left: "55%" },
      region: "Africa",
      incident: "Model Poison",
      description: "Brand Damage",
    },
  ];

  const aiMetrics = [
    {
      icon: Building,
      percentage: "87%",
      label: "Companies Using AI",
      description: "Enterprises adopted AI in 2024",
    },
    {
      icon: AlertTriangle,
      percentage: "64%",
      label: "Security Incidents",
      description: "AI-related breaches reported",
    },
    {
      icon: TrendingUp,
      percentage: "340%",
      label: "Attack Growth",
      description: "Rise in AI-targeted attacks",
    },
    {
      icon: Users,
      percentage: "2.1B",
      label: "Users At Risk",
      description: "People affected by AI breaches",
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
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-black dark:text-white mb-6">
            AI Security Breaches Cost Companies{" "}
            <span className="text-red-600 dark:text-red-400">Millions</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Real stories from companies who learned the hard way that AI
            security isn't optional
          </p>
        </motion.div>

        {/* Global Map with Breach Stories */}
        <motion.div
          className="relative mb-16"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
            {/* World Map Background */}
            <div className="relative h-96 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden">
              <Globe className="absolute inset-0 w-full h-full text-gray-400 dark:text-gray-600 opacity-20" />

              {/* Breach Story Markers */}
              {breachStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ top: story.location.top, left: story.location.left }}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="bg-red-500 w-4 h-4 rounded-full animate-pulse"></div>
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-900 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 whitespace-nowrap z-10">
                    <div className="text-xs font-bold text-red-600 dark:text-red-400">
                      {story.incident}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {story.description}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real AI security breaches reported globally in 2024
              </p>
            </div>
          </div>
        </motion.div>

        {/* AI Adoption Metrics */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {aiMetrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="p-6 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="flex justify-center mb-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <metric.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-black dark:text-white mb-1">
                  {metric.percentage}
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {metric.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.description}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            Don't let your company become the next cautionary tale
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
            <Clock className="w-5 h-5" />
            <span>
              The average breach costs $4.45M and takes 287 days to identify
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
