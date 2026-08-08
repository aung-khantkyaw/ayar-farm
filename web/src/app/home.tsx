import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { FeatureHighlights } from "@/components/sections/FeatureHighlights";
import { WhyAyarFarm } from "@/components/sections/WhyAyarFarm";
import { AppShowcase } from "@/components/sections/AppShowcase";
import { AIAssistant } from "@/components/sections/AIAssistant";
// import { Community } from "@/components/sections/Community"
import { DownloadCTA } from "@/components/sections/DownloadCTA";

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FeatureHighlights />
        <WhyAyarFarm />
        <AppShowcase />
        <AIAssistant />
        {/* <Community /> */}
        <DownloadCTA />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
