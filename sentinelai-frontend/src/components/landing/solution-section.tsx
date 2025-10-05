"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Bot,
  Skull,
  Network,
  CheckCircle,
  ArrowDown,
  Shield,
  Zap,
  Eye,
  Activity,
} from "lucide-react";

export function SolutionSection() {
  const layers = [
    {
      id: 1,
      icon: Search,
      tag: "First Line Defense",
      title: "Regex Check",
      subtitle: "L1 Regex Firewall",
      description:
        "L1 offers basic regex-based filtering checking for hateful content, criminal intent, malicious commands, and suspicious patterns. This is our first level check against prompts and agent outputs.",
      features: [
        "Pattern matching for common threats",
        "Real-time content scanning",
        "< 10ms latency",
        "95% accuracy rate",
      ],
      visual: "regex",
      color: "from-gray-800 to-gray-900",
    },
    {
      id: 2,
      icon: Bot,
      tag: "LLM-Powered Defense",
      title: "Llama Guard 4",
      subtitle: "L2 Prompt Validation",
      description:
        "12B parameter model by Meta. An LLM-based input-output safeguard for advanced prompt validation. Detects jailbreak attempts, prompt injections, and adversarial inputs.",
      features: [
        "Meta's Llama Guard 4 (12B parameters)",
        "Context-aware threat detection",
        "Blocks jailbreak attempts",
        "98% threat detection rate",
      ],
      visual: "ai",
      color: "from-gray-800 to-gray-900",
    },
    {
      id: 3,
      icon: Skull,
      tag: "Code Security",
      title: "Backdoor & Hallucination Check",
      subtitle: "L3 Backdoor Guard",
      description:
        "Geared towards AI code generation. Flags destructive commands like rm -rf, DROP DATABASE, file system manipulations, and other dangerous operations before execution.",
      features: [
        "Detects malicious code patterns",
        "Identifies hallucinated outputs",
        "Blocks dangerous system calls",
        "AST-based analysis",
      ],
      visual: "code",
      color: "from-gray-800 to-gray-900",
    },
    {
      id: 4,
      icon: Network,
      tag: "Context Intelligence",
      title: "Multi-Agent Context Validator",
      subtitle: "L4 Multi-Agent Validator",
      description:
        "Tailored for multi-agent workflows where context is fragmented across agents. Performs semantic validation to detect context poisoning and agent coordination attacks.",
      features: [
        "Cross-agent context analysis",
        "Semantic consistency checks",
        "Agent behavior monitoring",
        "Workflow integrity validation",
      ],
      visual: "network",
      color: "from-gray-800 to-gray-900",
    },
  ];

  const visualComponents = {
    regex: (
      <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-hidden">
        <div className="mb-2 text-slate-400">// Regex Patterns</div>
        <div>^(?!.*rm\\s+-rf).*$</div>
        <div>^(?!.*DROP\\s+DATABASE).*$</div>
        <div className="text-red-400 mt-2">⚠ BLOCKED: rm -rf /</div>
      </div>
    ),
    ai: (
      <div className="relative">
        <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto">
          <Bot className="w-16 h-16 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
      </div>
    ),
    code: (
      <div className="bg-slate-900 text-red-400 p-4 rounded-lg font-mono text-sm">
        <div className="text-slate-400 mb-2">Dangerous Code Detected:</div>
        <div className="bg-red-900/30 p-2 rounded border-l-4 border-red-500">
          <div>subprocess.run(['rm', '-rf', '/'])</div>
          <div className="text-red-300 text-xs mt-1">🚫 BLOCKED</div>
        </div>
      </div>
    ),
    network: (
      <div className="relative w-40 h-32 mx-auto">
        {/* Central node */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        {/* Connected nodes */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center"
          >
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        ))}
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full">
          <line
            x1="50%"
            y1="50%"
            x2="20%"
            y2="20%"
            stroke="#a855f7"
            strokeWidth="2"
          />
          <line
            x1="50%"
            y1="50%"
            x2="80%"
            y2="20%"
            stroke="#a855f7"
            strokeWidth="2"
          />
          <line
            x1="50%"
            y1="50%"
            x2="20%"
            y2="80%"
            stroke="#a855f7"
            strokeWidth="2"
          />
          <line
            x1="50%"
            y1="50%"
            x2="80%"
            y2="80%"
            stroke="#a855f7"
            strokeWidth="2"
          />
        </svg>
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
          <Badge className="mb-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 text-purple-300 border border-purple-700/30">
            <Shield className="w-4 h-4 mr-2" />
            Multi-Layer Protection
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              4-Layer Defense System
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Comprehensive protection at every stage of your AI pipeline
          </p>
        </motion.div>

        {/* Defense Layers */}
        <div className="space-y-12">
          {layers.map((layer, index) => (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <Card
                className={`p-8 bg-gradient-to-br from-gray-900/80 to-gray-800/60 border-2 border-gray-700/50 hover:border-gray-600/70 transition-all duration-300 backdrop-blur-sm`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Content */}
                  <div className={`${index % 2 === 1 ? "lg:order-2" : ""}`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className={`p-3 rounded-full bg-gradient-to-r ${layer.color} text-white`}
                      >
                        <layer.icon className="w-8 h-8" />
                      </div>
                      <div>
                        <Badge className="mb-2">{layer.tag}</Badge>
                        <h3 className="text-2xl font-bold text-white">
                          {layer.title}
                        </h3>
                        <p className="text-gray-300 font-medium">
                          {layer.subtitle}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {layer.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {layer.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-200">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual */}
                  <div
                    className={`flex justify-center ${
                      index % 2 === 1 ? "lg:order-1" : ""
                    }`}
                  >
                    <motion.div
                      className="w-full max-w-sm"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {
                        visualComponents[
                          layer.visual as keyof typeof visualComponents
                        ]
                      }
                    </motion.div>
                  </div>
                </div>
              </Card>

              {/* Connection Arrow */}
              {index < layers.length - 1 && (
                <motion.div
                  className="flex justify-center py-8"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.5 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ArrowDown className="w-8 h-8 text-gray-500" />
                    <span className="text-sm text-gray-400">Next Layer</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                99.8%
              </div>
              <div className="text-gray-400">Threat Detection Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                &lt;50ms
              </div>
              <div className="text-gray-400">Average Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                Zero
              </div>
              <div className="text-gray-400">False Positives</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
