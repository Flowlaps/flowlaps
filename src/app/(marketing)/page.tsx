import { HeroSection } from "@/components/marketing/hero-section";
import { ReportPreviewSection } from "@/components/marketing/report-preview-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { DifferentiationSection } from "@/components/marketing/differentiation-section";
import { WaitlistSection } from "@/components/marketing/waitlist-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { WhoItsForSection } from "@/components/marketing/who-its-for-section";
import { ClosingCtaSection } from "@/components/marketing/closing-cta-section";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ReportPreviewSection />
      <ProblemSection />
      <DifferentiationSection />
      <WaitlistSection />
      <HowItWorksSection />
      <WhoItsForSection />
      <ClosingCtaSection />
    </>
  );
}
