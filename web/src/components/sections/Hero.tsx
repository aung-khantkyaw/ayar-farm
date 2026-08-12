import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/PhoneMockup";
import { ArrowRight, Download, Play } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { ActiveVideo, Application } from "@/lib/interface";

export function Hero() {
  const { language } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [, setAppsLoading] = useState(true);

  const fetchActiveVideo = async () => {
    try {
      const response = await api.get(
        "/resources/resources?type=VIDEO&isActive=true",
      );

      if (response?.resources) {
        setActiveVideo(response.resources);
      }
    } catch (error) {
      console.error("Error fetching active video:", error);
    } finally {
      setVideoLoading(false);
    }
  };

  const fetchActiveApplications = async () => {
    try {
      const response = await api.get(
        "/resources/resources?type=APPLICATION&isActive=true",
      );

      if (response?.resources) {
        const resources = response.resources;
        setApplications(Array.isArray(resources) ? resources : [resources]);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error("Error fetching active applications:", error);
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  };

  const handleDownload = async (appId: string, appUrl: string) => {
    try {
      await api.patch(`/resources/resources/${appId}`);
      window.open(appUrl, "_blank");
    } catch (error) {
      console.error("Error downloading application:", error);
      window.open(appUrl, "_blank");
    }
  };

  useEffect(() => {
    fetchActiveVideo();
    fetchActiveApplications();
  }, []);

  const content = {
    my: {
      title: "AyarFarm Link",
      subtitle: "သင့်စိုက်ပျိုးမွေးမြူရေး ဗဟုသုတမိတ်ဖက်",
      description:
        "လယ်သမားများနှင့် ချိတ်ဆက်ပါ၊ ကျွမ်းကျင်သူများထံမှ ဗဟုသုတများကို လေ့လာပါ၊ အချိန်နှင့်တစ်ပြေးညီ ဈေးကွက်ပေါက်ဈေးများကို ရယူပါ၊ AI နည်းပညာသုံး အကူအညီဖြင့် မေးမြန်းဆွေးနွေးပါ — အားလုံးကို မိုဘိုင်းအက်ပ် တစ်ခုတည်းတွင် အသုံးပြုနိုင်ပါသည်။",
      downloadButton: "Android အတွက် ဒေါင်းလုဒ်ရယူရန်",
      learnMoreButton: "ပိုမိုလေ့လာရန်",
      features: [
        "အခမဲ့ အသုံးပြုနိုင်ခြင်း",
        "လယ်သမား အသိုင်းအဝိုင်း",
        "AI နည်းပညာ အကူအညီ",
      ],
    },

    en: {
      title: "AyarFarm Link",
      subtitle: "Your Agricultural Knowledge Companion",
      description:
        "Connect with farmers, access expert knowledge, get real-time market prices, and receive AI-powered farming assistance—all in one mobile app.",
      downloadButton: "Download for Android",
      learnMoreButton: "Learn More",
      features: ["Free to use", "Farmer community", "AI-powered assistance"],
    },
  };

  const t = content[language];

  return (
    <section
      id="home"
      className="min-h-screen pt-16 flex items-center bg-gradient-to-b from-background to-muted/20"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                {t.title}
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground font-medium">
                {t.subtitle}
              </p>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
                {t.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {applications.length > 0 ? (
                applications.slice(0, 1).map((app) => (
                  <Button
                    key={app.id}
                    size="lg"
                    onClick={() => handleDownload(app.id, app.resource_url[0])}
                    className="gap-2 text-base"
                  >
                    <Download className="w-5 h-5" />
                    {t.downloadButton}
                  </Button>
                ))
              ) : (
                <Button size="lg" className="gap-2 text-base">
                  <Download className="w-5 h-5" />
                  {t.downloadButton}
                </Button>
              )}

              <Button size="lg" variant="outline" className="gap-2 text-base">
                {t.learnMoreButton}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {t.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className="flex justify-center lg:justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger>
                <div className="cursor-pointer">
                  <PhoneMockup variant="hero">
                    {videoLoading ? (
                      <div className="w-full h-full bg-muted animate-pulse" />
                    ) : activeVideo?.resource_url ? (
                      <video
                        src={activeVideo.resource_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src="/example.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-8 h-8 text-primary ml-1" />
                      </div>
                    </div>
                  </PhoneMockup>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0">
                {videoLoading ? (
                  <div className="w-full h-96 bg-muted animate-pulse" />
                ) : activeVideo?.resource_url ? (
                  <video
                    src={activeVideo.resource_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <video
                    src="/example.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full h-auto rounded-lg"
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </section>
  );
}
