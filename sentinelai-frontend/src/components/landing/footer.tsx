"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Github,
  Twitter,
  Linkedin,
  Mail,
  FileText,
  Book,
  MessageCircle,
  Building,
  Users,
  Award,
  ExternalLink,
} from "lucide-react";

export function Footer() {
  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Security Layers", href: "#security" },
      { name: "Integrations", href: "#integrations" },
      { name: "Pricing", href: "#pricing" },
      { name: "Enterprise", href: "#enterprise" },
    ],
    resources: [
      { name: "Documentation", href: "#docs", icon: Book },
      { name: "API Reference", href: "#api", icon: FileText },
      { name: "Security Guide", href: "#guide", icon: Shield },
      { name: "Blog", href: "#blog", icon: FileText },
      { name: "Case Studies", href: "#cases", icon: Award },
    ],
    company: [
      { name: "About Us", href: "#about" },
      { name: "Careers", href: "#careers" },
      { name: "Contact", href: "#contact" },
      { name: "Press", href: "#press" },
      { name: "Partners", href: "#partners" },
    ],
    legal: [
      { name: "Privacy Policy", href: "#privacy" },
      { name: "Terms of Service", href: "#terms" },
      { name: "Cookie Policy", href: "#cookies" },
      { name: "Security", href: "#security-policy" },
      { name: "Compliance", href: "#compliance" },
    ],
  };

  const socialLinks = [
    {
      name: "Twitter",
      icon: Twitter,
      href: "#twitter",
      color: "hover:text-blue-400",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: "#linkedin",
      color: "hover:text-blue-600",
    },
    {
      name: "GitHub",
      icon: Github,
      href: "#github",
      color: "hover:text-gray-600",
    },
    {
      name: "Email",
      icon: Mail,
      href: "#email",
      color: "hover:text-green-500",
    },
  ];

  const certifications = [
    "SOC 2 Type II",
    "ISO 27001",
    "GDPR Compliant",
    "CCPA Ready",
  ];

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Company Info */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {/* Logo */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-white">
                    SentinelAI
                  </span>
                </div>

                <p className="text-slate-400 leading-relaxed max-w-md">
                  Enterprise-grade AI security platform with 4-layer defense
                  system. Protect your AI applications from malicious attacks
                  with real-time monitoring and automated response.
                </p>
              </motion.div>

              {/* Contact Info */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">
                    123 Security Street, Tech City, TC 12345
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-purple-400" />
                  <a
                    href="mailto:contact@sentinelai.com"
                    className="text-sm hover:text-white transition-colors"
                  >
                    contact@sentinelai.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">24/7 Support Available</span>
                </div>
              </motion.div>

              {/* Social Links */}
              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className={`w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-slate-700 ${social.color}`}
                    aria-label={social.name}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </motion.div>
            </div>

            {/* Links Sections */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="text-white font-semibold">Product</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="text-white font-semibold">Resources</h4>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
                    >
                      {link.icon && <link.icon className="w-4 h-4" />}
                      {link.name}
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4 className="text-white font-semibold">Company</h4>
              <ul className="space-y-3 mb-8">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>

              <h4 className="text-white font-semibold">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Certifications */}
        {/* <motion.div
          className="py-8 border-t border-slate-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center">
            <h4 className="text-white font-semibold mb-4 flex items-center justify-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Security & Compliance Certifications
            </h4>
            <div className="flex flex-wrap justify-center gap-6">
              {certifications.map((cert, index) => (
                <div
                  key={cert}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700"
                >
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div> */}

        {/* Bottom Bar
        <motion.div
          className="py-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-sm text-slate-400">
            © 2025 SentinelAI. All rights reserved.
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-400" />
              <span>500+ Companies Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>10M+ Threats Blocked</span>
            </div>
          </div>
        </motion.div> */}
      </div>
    </footer>
  );
}
