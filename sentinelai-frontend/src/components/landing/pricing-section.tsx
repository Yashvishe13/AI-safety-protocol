"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  Star,
  Users,
  Building,
  Zap,
  Shield,
  Clock,
  Phone,
} from "lucide-react";
import Link from "next/link";

export function PricingSection() {
  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "$99",
      period: "/month",
      description: "Perfect for small teams getting started with AI security",
      popular: false,
      color: "from-green-500 to-emerald-600",
      features: [
        "Up to 100K API calls/month",
        "4-layer security protection",
        "Real-time monitoring dashboard",
        "Basic threat analytics",
        "Email support",
        "99.5% uptime SLA",
        "Standard integrations",
        "Community access",
      ],
      limitations: [
        "Limited to 5 team members",
        "48-hour support response",
        "Basic compliance reports",
      ],
      cta: "Start Free Trial",
      icon: Users,
    },
    {
      id: "pro",
      name: "Professional",
      price: "$499",
      period: "/month",
      description:
        "Advanced security for growing companies and production workloads",
      popular: true,
      color: "from-purple-500 to-blue-600",
      features: [
        "Up to 1M API calls/month",
        "4-layer security protection",
        "Advanced analytics & reporting",
        "Custom security policies",
        "Priority support (24/7)",
        "99.9% uptime SLA",
        "Advanced integrations",
        "Slack & Teams integration",
        "Custom webhooks",
        "Advanced compliance reports",
        "Team collaboration tools",
        "Audit logs & forensics",
      ],
      limitations: [],
      cta: "Start Free Trial",
      icon: Building,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      period: "/month",
      description:
        "Tailored solutions for large organizations with custom requirements",
      popular: false,
      color: "from-slate-700 to-slate-900",
      features: [
        "Unlimited API calls",
        "Custom security layers",
        "Dedicated security team",
        "Custom integrations",
        "White-glove onboarding",
        "99.99% uptime SLA",
        "Enterprise SSO",
        "Advanced RBAC",
        "Custom compliance",
        "Dedicated support manager",
        "On-premise deployment",
        "Custom SLA agreements",
        "Priority feature requests",
        "Training & workshops",
      ],
      limitations: [],
      cta: "Contact Sales",
      icon: Shield,
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
    <section className="py-20 bg-white dark:bg-slate-900">
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
            Simple,{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your AI security needs. All plans
            include our 4-layer defense system.
          </p>

          {/* Pricing Toggle Info */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>14-day free trial</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>No setup fees</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              variants={cardVariants}
              transition={{ duration: 0.6 }}
            >
              <Card
                className={`relative p-8 h-full ${
                  plan.popular
                    ? "border-2 border-purple-500 shadow-2xl shadow-purple-500/20 scale-105"
                    : "border border-border hover:border-purple-300 dark:hover:border-purple-700"
                } transition-all duration-300 group`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 text-sm font-semibold">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center text-white`}
                    >
                      <plan.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="text-center">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl lg:text-5xl font-bold">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {plan.period}
                      </span>
                    </div>
                    {plan.id === "starter" && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Then $99/month
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  {plan.cta === "Start Free Trial" ? (
                    <Link href="/dashboard" className="block">
                      <Button
                        className={`w-full ${
                          plan.popular
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                            : "variant-outline hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        } py-3`}
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                          : "variant-outline hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      } py-3`}
                      size="lg"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {plan.cta}
                    </Button>
                  )}

                  {/* Features */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      What&apos;s included
                    </h4>
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h3 className="text-2xl font-bold mb-8">
            Frequently Asked Questions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold mb-2">
                Can I upgrade or downgrade my plan?
              </h4>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect immediately, and billing is prorated.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">
                What happens after my free trial?
              </h4>
              <p className="text-muted-foreground text-sm">
                Your trial automatically converts to the Starter plan. You can
                upgrade, downgrade, or cancel at any time.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">
                Do you offer custom pricing for high volume?
              </h4>
              <p className="text-muted-foreground text-sm">
                Yes, our Enterprise plan offers custom pricing for organizations
                with high-volume API usage or special requirements.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Is there a setup fee?</h4>
              <p className="text-muted-foreground text-sm">
                No setup fees for any plan. You only pay the monthly
                subscription fee, and you can cancel anytime.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
