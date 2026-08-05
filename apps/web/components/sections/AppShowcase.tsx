"use client"

import { PhoneMockup } from "@/components/PhoneMockup"
import { useLanguage } from "@/lib/LanguageContext"

export function AppShowcase() {
  const { language } = useLanguage()

  const content = {
    my: {
      title: "အက်ပ်ကို လက်တွေ့လေ့လာကြည့်ပါ",
      description: "နည်းပညာကျွမ်းကျင်မှု မည်သို့ပင်ရှိစေကာမူ တောင်သူများအားလုံး အလွယ်တကူ အသုံးပြုနိုင်ရန် ဖန်တီးထားသော အက်ပ်ဒီဇိုင်းကို လက်တွေ့ခံစားကြည့်ပါ။",
      phone1: {
        title: "ဗဟုသုတကဏ္ဍ",
        subtitle: "ဆောင်းပါးများနှင့် လမ်းညွှန်များကို ဖတ်ရှုရန်",
      },
      phone2: {
        title: "ဈေးကွက်ပေါက်ဈေးများ",
        subtitle: "အချိန်နှင့်တစ်ပြေးညီ ဈေးနှုန်းအပြောင်းအလဲများ",
      },
      phone3: {
        title: "AI Chat",
        subtitle: "စိုက်ပျိုးမွေးမြူရေး အကြံဉာဏ်များ ချက်ချင်းရယူရန်",
      },
    },
    en: {
      title: "See It in Action",
      description: "Experience the intuitive interface designed for farmers of all technical backgrounds.",
      phone1: {
        title: "Knowledge Feed",
        subtitle: "Browse articles & guides",
      },
      phone2: {
        title: "Market Prices",
        subtitle: "Real-time price updates",
      },
      phone3: {
        title: "AI Chat",
        subtitle: "Instant farming advice",
      },
    },
  };

  const t = content[language]

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
          {/* Phone 1 - Knowledge Feed */}
          <div className="text-center space-y-4">
            <PhoneMockup variant="showcase">
              <img
                src="/1.png"
                className="w-full h-full object-cover"
              />
            </PhoneMockup>
            <p className="font-medium">{t.phone1.title}</p>
            <p className="text-sm text-muted-foreground">{t.phone1.subtitle}</p>
          </div>

          {/* Phone 2 - Market Prices */}
          <div className="text-center space-y-4">
            <PhoneMockup variant="showcase">
              <img
                src="/2.png"
                className="w-full h-full object-cover"
              />
            </PhoneMockup>
            <p className="font-medium">{t.phone2.title}</p>
            <p className="text-sm text-muted-foreground">{t.phone2.subtitle}</p>
          </div>

          {/* Phone 3 - AI Chat */}
          <div className="text-center space-y-4">
            <PhoneMockup variant="showcase">
              <img
                src="/3.png"
                className="w-full h-full object-cover"
              />
            </PhoneMockup>
            <p className="font-medium">{t.phone3.title}</p>
            <p className="text-sm text-muted-foreground">{t.phone3.subtitle}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
