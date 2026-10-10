import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CoverSheet } from "@/components/CoverSheet";
import HeroOrb from "@/components/HeroOrb";
import { Hero } from "@/components/sections/Hero";

import { Services } from "@/components/sections/Services";
import { WhyUs } from "@/components/sections/WhyUs";
import { Work } from "@/components/sections/Work";
import { Process } from "@/components/sections/Process";
import { Pricing } from "@/components/sections/Pricing";
import { Faq } from "@/components/sections/Faq";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* Desktop: hero + strip fill one screen. The hero scrolls away normally while
            the strip stays pinned at the bottom of the screen, and the next section
            slides up over it like a sheet. Phones scroll normally. */}
        <Hero />

        <CoverSheet>
          <HeroOrb />
          <Services />
          <WhyUs />
          <Work />
          <Process />
          <Pricing />
          <Faq />
          <Contact />
        </CoverSheet>
      </main>
      <Footer />
    </>
  );
}
