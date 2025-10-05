"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Settings,
  Shield,
  ArrowRight,
  Code,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export function HowItWorksSection() {
  const steps = [
    {
      id: 1,
      number: "01",
      title: "Integrate",
      description:
        "Add SentinelAI SDK to your application in minutes with our simple integration process",
      icon: Download,
      color: "from-green-500 to-emerald-600",
      visual: "code",
    },
    {
      id: 2,
      number: "02",
      title: "Configure",
      description:
        "Set up security policies and thresholds tailored to your specific needs and use cases",
      icon: Settings,
      color: "from-blue-500 to-cyan-600",
      visual: "dashboard",
    },
    {
      id: 3,
      number: "03",
      title: "Monitor",
      description:
        "Watch threats get blocked automatically in real-time with comprehensive security monitoring",
      icon: Shield,
      color: "from-purple-500 to-pink-600",
      visual: "monitoring",
    },
  ];

  const visualComponents = {
    code: (
      <div className="bg-slate-900 rounded-lg p-4 text-sm font-mono text-left overflow-hidden">
        <div className="text-green-400 mb-2"># Install SentinelAI SDK</div>
        <div className="text-slate-300 mb-4">npm install @sentinelai/sdk</div>

        <div className="text-blue-400 mb-2">// Initialize protection</div>
        <div className="text-slate-300 mb-1">
          import {`{`} SentinelAI {`}`} from &apos;@sentinelai/sdk&apos;;
        </div>
        <div className="text-slate-300 mb-4">
          const sentinel = new SentinelAI(apiKey);
        </div>

        <div className="text-yellow-400 mb-2">// Protect your LLM calls</div>
        <div className="text-slate-300">
          const response = await sentinel.protect(
        </div>
        <div className="text-slate-300 ml-4">prompt, llmCall</div>
        <div className="text-slate-300">);</div>
      </div>
    ),
    dashboard: (
      <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Security Policies</div>
          <Badge className="text-xs bg-green-100 text-green-700">Active</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded text-xs">
            <span>Prompt Injection Detection</span>
            <div className="w-8 h-4 bg-green-500 rounded-full relative">
              <div className="absolute right-0 w-4 h-4 bg-white rounded-full shadow transform translate-x-0"></div>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded text-xs">
            <span>Code Security Check</span>
            <div className="w-8 h-4 bg-green-500 rounded-full relative">
              <div className="absolute right-0 w-4 h-4 bg-white rounded-full shadow"></div>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded text-xs">
            <span>Context Validation</span>
            <div className="w-8 h-4 bg-blue-500 rounded-full relative">
              <div className="absolute left-0 w-4 h-4 bg-white rounded-full shadow"></div>
            </div>
          </div>
        </div>
      </div>
    ),
    monitoring: (
      <div className="bg-slate-900 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Live Monitoring
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Threats Blocked</span>
            <span className="text-green-400 font-bold">1,247</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Requests Processed</span>
            <span className="text-blue-400 font-bold">45,892</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Response Time</span>
            <span className="text-purple-400 font-bold">23ms</span>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-2">
          <div className="text-red-400 text-xs flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>BLOCKED: Injection attempt detected</span>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Protect Your AI in{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              3 Simple Steps
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Get enterprise-grade AI security up and running in under 10 minutes
          </p>
        </motion.div>

        {/* Steps Timeline */}
        <div className="space-y-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Content */}
                <div
                  className={`${index % 2 === 1 ? "lg:order-2" : ""} space-y-6`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-xl`}
                    >
                      {step.number}
                    </div>
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-r ${step.color} text-white`}
                    >
                      <step.icon className="w-6 h-6" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-3xl font-bold mb-4 text-white">
                      {step.title}
                    </h3>
                    <p className="text-xl text-gray-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-3">
                    {step.id === 1 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Code className="w-4 h-4" />
                          <span>
                            Available for Python, Node.js, Java, and more
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Download className="w-4 h-4" />
                          <span>Zero-config setup with sensible defaults</span>
                        </div>
                      </div>
                    )}

                    {step.id === 2 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Settings className="w-4 h-4" />
                          <span>Web dashboard and API configuration</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Badge className="w-4 h-4" />
                          <span>Pre-built templates for common use cases</span>
                        </div>
                      </div>
                    )}

                    {step.id === 3 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <BarChart3 className="w-4 h-4" />
                          <span>Real-time dashboards and alerts</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Shield className="w-4 h-4" />
                          <span>Automatic threat blocking and reporting</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual */}
                <div
                  className={`${
                    index % 2 === 1 ? "lg:order-1" : ""
                  } flex justify-center`}
                >
                  <motion.div
                    className="w-full max-w-md"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="p-6 bg-gray-900/80 border-gray-700/50 shadow-xl backdrop-blur-sm">
                      {
                        visualComponents[
                          step.visual as keyof typeof visualComponents
                        ]
                      }
                    </Card>
                  </motion.div>
                </div>
              </div>

              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <motion.div
                  className="flex justify-center py-12"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.5 }}
                >
                  <div className="flex items-center gap-4 text-gray-400">
                    <div className="hidden sm:block w-16 h-px bg-gradient-to-r from-purple-400/50 to-blue-400/50"></div>
                    <ArrowRight className="w-8 h-8 text-purple-400" />
                    <div className="hidden sm:block w-16 h-px bg-gradient-to-r from-purple-400/50 to-blue-400/50"></div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-purple-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Built for Innovation</h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              SentinelAI is a prototype showcasing the future of AI security.
              Built with modern tech stack and innovative security layers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <button className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
