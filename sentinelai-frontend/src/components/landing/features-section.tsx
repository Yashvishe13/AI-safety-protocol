"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  Zap,
  FileText,
  Settings,
  Plug,
  Award,
  Eye,
  Shield,
  Clock,
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      id: 1,
      icon: BarChart3,
      title: "Real-Time Monitoring",
      description:
        "Monitor every AI interaction in real-time with comprehensive dashboards and detailed analytics",
      gradient: "from-blue-500 to-cyan-500",
      benefits: [
        "Live threat detection",
        "Performance metrics",
        "Usage analytics",
      ],
    },
    {
      id: 2,
      icon: Zap,
      title: "Automated Response",
      description:
        "Instant threat blocking and automated incident response to protect your applications 24/7",
      gradient: "from-yellow-500 to-orange-500",
      benefits: ["Instant blocking", "Auto-remediation", "Alert notifications"],
    },
    {
      id: 3,
      icon: FileText,
      title: "Audit Logging",
      description:
        "Complete audit trail for compliance and forensics with detailed logs of every security event",
      gradient: "from-green-500 to-emerald-500",
      benefits: [
        "Compliance ready",
        "Forensic analysis",
        "Export capabilities",
      ],
    },
    {
      id: 4,
      icon: Settings,
      title: "Custom Rules",
      description:
        "Define custom security policies and rules tailored for your specific use case and industry",
      gradient: "from-purple-500 to-pink-500",
      benefits: ["Custom policies", "Rule templates", "Industry standards"],
    },
    {
      id: 5,
      icon: Plug,
      title: "API Integration",
      description:
        "Drop-in security layer for any LLM application with simple SDK integration and minimal code changes",
      gradient: "from-indigo-500 to-blue-500",
      benefits: [
        "Easy integration",
        "Multi-language SDKs",
        "REST & GraphQL APIs",
      ],
    },
    {
      id: 6,
      icon: Award,
      title: "SOC 2 Compliant",
      description:
        "Enterprise-grade security and compliance standards with regular audits and certifications",
      gradient: "from-red-500 to-pink-500",
      benefits: ["SOC 2 Type II", "ISO 27001", "GDPR compliant"],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
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
            Built for{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Enterprise Security Teams
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive security features designed for modern AI applications
            and enterprise requirements
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              variants={cardVariants}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-8 h-full bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700 hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-500/5 transition-all duration-300 group">
                <div className="space-y-6">
                  {/* Icon */}
                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <div
                      className="absolute inset-0 bg-gradient-to-r opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(to right, ${
                          feature.gradient.split(" ")[1]
                        }, ${feature.gradient.split(" ")[3]})`,
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-3xl p-8 border border-purple-200 dark:border-purple-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Stat 1 */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <Eye className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  24/7
                </div>
                <div className="text-sm text-muted-foreground">
                  Continuous Monitoring
                </div>
              </div>

              {/* Stat 2 */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  99.9%
                </div>
                <div className="text-sm text-muted-foreground">
                  Uptime Guarantee
                </div>
              </div>

              {/* Stat 3 */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  &lt;5min
                </div>
                <div className="text-sm text-muted-foreground">Setup Time</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
