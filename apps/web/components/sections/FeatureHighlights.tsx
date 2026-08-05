"use client"

import { FeatureCard } from "@/components/FeatureCard"
import { BookOpen, Users, Bot, TrendingUp, DollarSign, Video } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

export function FeatureHighlights() {
  const { language } = useLanguage()

  const content = {
    my: {
      title: "အောင်မြင်ရန် လိုအပ်သမျှ အရာအားလုံး",
      description: "တောင်သူများအနေဖြင့် မှန်ကန်သော ဆုံးဖြတ်ချက်များ ချမှတ်နိုင်ရန်နှင့် ၎င်းတို့၏ စိုက်ပျိုးမွေးမြူရေးလုပ်ငန်းများ ပိုမိုတိုးတက်ကောင်းမွန်လာစေရန် ဖန်တီးပေးထားသော အကောင်းမွန်ဆုံး လုပ်ဆောင်ချက်များ။",
      features: [
        {
          icon: BookOpen,
          title: "ဗဟုသုတ စာကြည့်တိုက်",
          description: "စိုက်ပျိုးမွေးမြူရေးဆိုင်ရာ ဆောင်းပါးများ၊ လမ်းညွှန်ချက်များနှင့် ကျွမ်းကျင်ပညာရှင်များ၏ ဗဟုသုတများကို ပြည့်ပြည့်စုံစုံ လေ့လာဖတ်ရှုနိုင်ပါသည်။",
        },
        {
          icon: Users,
          title: "တောင်သူ အသိုင်းအဝိုင်း",
          description: "အခြားတောင်သူများနှင့် ချိတ်ဆက်ပြီး အတွေ့အကြုံများကို မျှဝေကာ အချင်းချင်း အပြန်အလှန် လေ့လာသင်ယူနိုင်ပါသည်။",
        },
        {
          icon: Bot,
          title: "AI စိုက်ပျိုးရေး လက်ထောက်",
          description: "ကျွန်ုပ်တို့၏ AI နည်းပညာသုံး လက်ထောက်မှတစ်ဆင့် သင်၏ စိုက်ပျိုးမွေးမြူရေးဆိုင်ရာ မေးခွန်းများအတွက် အဖြေများကို ချက်ချင်းရယူနိုင်ပါသည်။",
        },
        {
          icon: TrendingUp,
          title: "ဈေးကွက် သုံးသပ်ချက်",
          description: "ဈေးကွက်အတွင်း ပြောင်းလဲနေမှုများနှင့် စိုက်ပျိုးမွေးမြူရေးဆိုင်ရာ အချက်အလက်များကို အသေးစိတ် သိရှိနိုင်ပါသည်။",
        },
        {
          icon: DollarSign,
          title: "နေ့စဉ် ဈေးကွက်ပေါက်ဈေးများ",
          description: "သင့်ဒေသအတွင်းရှိ သီးနှံဈေးနှုန်းများနှင့် ဈေးကွက်ပေါက်ဈေးများကို အချိန်နှင့်တစ်ပြေးညီ သိရှိနိုင်ပါသည်။",
        },
        {
          icon: Video,
          title: "ပညာပေး ဗီဒီယိုများ",
          description: "သင်ခန်းစာ ဗီဒီယိုများကို ကြည့်ရှုပြီး ကျွမ်းကျင်ပညာရှင်များထံမှ ခေတ်မီ စိုက်ပျိုးမွေးမြူရေး နည်းပညာများကို လေ့လာသင်ယူနိုင်ပါသည်။",
        },
      ],
    },
    en: {
      title: "Everything You Need to Succeed",
      description: "Powerful features designed to help farmers make informed decisions and improve their agricultural practices.",
      features: [
        {
          icon: BookOpen,
          title: "Knowledge Library",
          description: "Access a comprehensive library of agricultural articles, guides, and expert knowledge.",
        },
        {
          icon: Users,
          title: "Farmer Community",
          description: "Connect with fellow farmers, share experiences, and learn from each other.",
        },
        {
          icon: Bot,
          title: "AI Farming Assistant",
          description: "Get instant answers to your farming questions with our AI-powered assistant.",
        },
        {
          icon: TrendingUp,
          title: "Market Analysis",
          description: "Stay informed with detailed market trends and agricultural insights.",
        },
        {
          icon: DollarSign,
          title: "Daily Market Prices",
          description: "Get real-time updates on crop prices and market rates in your region.",
        },
        {
          icon: Video,
          title: "Educational Videos",
          description: "Watch tutorial videos and learn modern farming techniques from experts.",
        },
      ],
    },
  };

  const t = content[language]

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
