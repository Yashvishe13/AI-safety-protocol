"use client";

import { motion } from "framer-motion";
import { ProblemSection } from "@/components/landing/problem-section";
import { SolutionSection } from "@/components/landing/solution-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";

import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { GlobalSecurityMap } from "@/components/landing/global-security-map";
import { HeroSection } from "@/components/landing/hero-section";

/**
 * Landing page component - SentinelAI marketing website
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      <HeroSection />
      <GlobalSecurityMap />
      {/* <ProblemSection /> */}
      <SolutionSection />
      {/* <FeaturesSection /> */}
      <HowItWorksSection />

      {/* <CTASection /> */}
      {/* <Footer /> */}
    </div>
  );
}
