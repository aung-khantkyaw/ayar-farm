"use client"

import { Button } from "@/components/ui/button"
import { Download, Shield, Smartphone } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

export function DownloadCTA() {
  const { language } = useLanguage()

  const content = {
    my: {
      title: "AyarFarm Link ကို ယနေ့ပင် ဒေါင်းလုဒ်ရယူလိုက်ပါ",
      description: "AyarFarm Link ကို အသုံးပြုနေကြသော ထောင်ပေါင်းများစွာသော တောင်သူများနှင့်အတူ ပူးပေါင်းပါဝင်ပြီး သင့်စိုက်ပျိုးမွေးမြူရေးလုပ်ငန်းများကို တိုးတက်ကောင်းမွန်စေကာ အထွက်နှုန်းများကို တိုးမြှင့်လိုက်ပါ။",
      downloadButton: "Android အတွက် ဒေါင်းလုဒ်ရယူရန်",
      playStoreButton: "Google Play Store",
      features: [
        "100% အခမဲ့",
        "အပိုကုန်ကျစရိတ် လုံးဝမရှိခြင်း",
        "လုံခြုံစိတ်ချရပြီး သီးသန့်လုံခြုံမှုရှိခြင်း",
      ],
      availability: "Android 5.0 နှင့်အထက် အသုံးပြုထားသော Android ဖုန်းများတွင် ရယူအသုံးပြုနိုင်ပါသည်။",
    },
    en: {
      title: "Download AyarFarm Link Today",
      description: "Join thousands of farmers already using AyarFarm Link to improve their agricultural practices and increase their yields.",
      downloadButton: "Download for Android",
      playStoreButton: "Google Play Store",
      features: [
        "100% Free",
        "No Hidden Fees",
        "Secure & Private",
      ],
      availability: "Available on Android devices running Android 5.0 and above.",
    },
  };

  const t = content[language]

  return (
    <section id="download" className="py-20 bg-gradient-to-b from-muted/50 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              {t.title}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2 text-base h-14 px-8">
              <Download className="w-5 h-5" />
              {t.downloadButton}
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-base h-14 px-8">
              <Smartphone className="w-5 h-5" />
              {t.playStoreButton}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
            {t.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {t.availability}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
