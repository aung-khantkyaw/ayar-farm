"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Check } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

export function WhyAyarFarm() {
  const { language } = useLanguage()

  const content = {
  my: {
    title: "AyarFarm Link ကို ဘာကြောင့် ရွေးချယ်သင့်သလဲ?",
    description: "လယ်သမားများအတွက် လယ်သမားများကိုယ်တိုင် တည်ဆောက်ထားပါသည်။ သင့်လိုအပ်ချက်များကို နားလည်ပြီး အထိရောက်ဆုံး ဖြေရှင်းနည်းများကို ပံ့ပိုးပေးပါသည်။",
    reasons: [
      {
        title: "ယုံကြည်စိတ်ချရသော စိုက်ပျိုးမွေးမြူရေး ဗဟုသုတ",
        description: "စိုက်ပျိုးမွေးမြူရေး ကျွမ်းကျင်ပညာရှင်များနှင့် သုတေသနအဖွဲ့အစည်းများမှ အတည်ပြုထားသော အချက်အလက်များကို ရယူလေ့လာနိုင်ပါသည်။",
      },
      {
        title: "အချိန်နှင့်တစ်ပြေးညီ ဈေးကွက်အချက်အလက်",
        description: "ဈေးကွက်ပေါက်ဈေးများနှင့် အပြောင်းအလဲများကို အချိန်နှင့်တစ်ပြေးညီ သိရှိနိုင်ပြီး မှန်ကန်သော ရောင်းဝယ်မှုဆုံးဖြတ်ချက်များကို ချမှတ်နိုင်ပါသည်။",
      },
      {
        title: "AI နည်းပညာသုံး အကူအညီ",
        description: "ကျွန်ုပ်တို့၏ ဉာဏ်ရည်မြင့် AI အကူအညီဖြင့် သင့်အတွက်ကိုက်ညီသော စိုက်ပျိုးမွေးမြူရေး အကြံဉာဏ်များကို ရယူနိုင်ပါသည်။",
      },
      {
        title: "အသိုင်းအဝိုင်းအတွင်း အပြန်အလှန်လေ့လာခြင်း",
        description: "အတွေ့အကြုံရှိ တောင်သူများထံမှ လေ့လာသင်ယူနိုင်ပြီး သင့်၏ ဗဟုသုတများကိုလည်း အသိုင်းအဝိုင်းအတွင်း ပြန်လည်မျှဝေနိုင်ပါသည်။",
      },
      {
        title: "အခမဲ့ မိုဘိုင်းအက်ပ်",
        description: "လုပ်ဆောင်ချက်များ အားလုံးကို အခမဲ့ အသုံးပြုနိုင်ပါသည်။ ယခုပင် ဒေါင်းလုဒ်ရယူပြီး စတင်အသုံးပြုလိုက်ပါ။",
      },
    ],
  },
  en: {
    title: "Why Choose AyarFarm Link?",
    description: "Built specifically for farmers, by farmers. We understand your needs and deliver solutions that matter.",
    reasons: [
      {
        title: "Reliable Agricultural Knowledge",
        description: "Access verified information from agricultural experts and research institutions.",
      },
      {
        title: "Real-time Market Information",
        description: "Stay updated with live market prices and trends for informed selling decisions.",
      },
      {
        title: "AI-Powered Assistance",
        description: "Get personalized farming advice through our intelligent AI assistant.",
      },
      {
        title: "Community Learning",
        description: "Learn from experienced farmers and share your own knowledge with the community.",
      },
      {
        title: "Free Mobile Application",
        description: "All features available at no cost. Download and start using immediately.",
      },
    ],
  },
};

  const t = content[language]

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.reasons.map((reason, index) => (
            <Card key={index} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">{reason.title}</h3>
                    <p className="text-sm text-muted-foreground">{reason.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
