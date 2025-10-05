"use client";

import { motion } from "framer-motion";
import { Database, Key, Bot, ArrowRight } from "lucide-react";

const painPoints = [
  {
    id: "1",
    title: "Production Data Deletion",
    icon: Database,
    problems: [
      "AI executes DROP DATABASE commands",
      "Automated cleanup tasks delete live data",
      "No rollback or validation mechanisms",
      "Corrupted backups unable to restore",
    ],
    loss: "$2.3M",
  },
  {
    id: "2",
    title: "Credential Exposure",
    icon: Key,
    problems: [
      "API keys pasted into public AI tools",
      "Secrets embedded in AI-generated code",
      "Credentials stored in training data",
      "Access tokens leaked through logs",
    ],
    loss: "$15M",
  },
  {
    id: "3",
    title: "Autonomous Agent Failures",
    icon: Bot,
    problems: [
      "Agents ignore human override commands",
      "Production systems shut down unexpectedly",
      "Multi-agent coordination attacks",
      "Uncontrolled self-modification behavior",
    ],
    loss: "$3M",
  },
];

export function GlobalSecurityMap() {
  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold mb-4 text-white">
            AI Security Pain Points
          </h2>
          <p className="text-gray-400">
            Common threats companies face with unprotected AI systems
          </p>
        </motion.div>

        {/* Horizontal Grid with Bullet Points */}
        <div className="grid md:grid-cols-3 gap-12 mb-20">
          {painPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Icon className="w-10 h-10 text-white mb-4" />
                <h3 className="text-xl font-bold text-white mb-4">
                  {point.title}
                </h3>
                <ul className="space-y-2 mb-6">
                  {point.problems.map((problem, idx) => (
                    <li
                      key={idx}
                      className="text-gray-400 text-sm flex items-start gap-2"
                    >
                      <span className="text-white mt-1">•</span>
                      <span>{problem}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-white font-semibold text-sm">
                  {point.loss} average loss
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Metrics Section */}
        <motion.div
          className="border-t border-gray-800 pt-16 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold text-white mb-3">87%</div>
              <div className="text-gray-400">
                Enterprises using AI in production
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white mb-3">64%</div>
              <div className="text-gray-400">
                Companies experienced AI security incidents
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white mb-3">340%</div>
              <div className="text-gray-400">
                Increase in AI-targeted attacks (2024)
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Message */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
            Don't let AI vulnerabilities destroy your business. SentinelAI
            provides
            <span className="text-white font-semibold">
              {" "}
              4-layer security protection
            </span>{" "}
            to stop threats before they cause damage.
          </p>
          <button className="inline-flex items-center gap-2 text-white hover:text-gray-300 transition-colors group">
            <span className="text-lg font-medium">
              Learn how we protect you
            </span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
