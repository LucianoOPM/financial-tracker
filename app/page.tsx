import { LandingNavbar } from "@components/landing/LandingNavbar";
import { LandingHero } from "@components/landing/LandingHero";
import { LandingFeatures } from "@components/landing/LandingFeatures";
import { LandingHowItWorks } from "@components/landing/LandingHowItWorks";
import { LandingPricing } from "@components/landing/LandingPricing";
import { LandingCTA } from "@components/landing/LandingCTA";
import { LandingFooter } from "@components/landing/LandingFooter";

export default function Home() {
  return (
    <>
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingCTA />
      </main>
      <LandingFooter />
    </>
  );
}
