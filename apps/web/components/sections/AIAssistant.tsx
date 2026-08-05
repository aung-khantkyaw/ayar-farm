"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Bot, MessageSquare, Sparkles, Zap } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

export function AIAssistant() {
  const { language } = useLanguage()

  const content = {
    my: {
      title: "AI နည်းပညာသုံး လယ်ယာလက်ထောက်",
      description: "စိုက်ပျိုးမွေးမြူရေးနှင့် ပတ်သက်၍ မေးစရာရှိပါသလား? မေးမြန်းနိုင်ပါသည်။ ကျွန်ုပ်တို့၏ ဉာဏ်ရည်မြင့် AI လက်ထောက်သည် ခေတ်မီနည်းပညာများကို အသုံးပြု၍ သင်သိလိုသော လယ်ယာဆိုင်ရာ အချက်အလက်များကို တိကျမှန်ကန်စွာဖြင့် ချက်ချင်း ပံ့ပိုးပေးပါမည်။",
      features: [
        {
          icon: MessageSquare,
          title: "သဘာဝကျကျ မေးမြန်းနိုင်ခြင်း",
          description: "မိမိပြောနေကျ စကားအသုံးအနှုန်းများဖြင့်ပင် မေးမြန်းနိုင်ပါသည်။ နည်းပညာဆိုင်ရာ အခေါ်အဝေါ်များ သုံးရန် မလိုအပ်ပါ။",
        },
        {
          icon: Sparkles,
          title: "ဉာဏ်ရည်မြင့် အဖြေများ",
          description: "သင့်အခြေအနေနှင့် အံဝင်ခွင်ကျဖြစ်ပြီး တိကျမှန်ကန်သော အဖြေများကို ရယူနိုင်ပါသည်။",
        },
        {
          icon: Zap,
          title: "ချက်ချင်း အဖြေရရှိခြင်း",
          description: "ကျွမ်းကျင်ပညာရှင်များကို အချိန်ပေး စောင့်ဆိုင်းရန်မလိုဘဲ လိုအပ်သော အဖြေများကို ချက်ချင်း ရယူနိုင်ပါသည်။",
        },
      ],
      aiLabel: "AI လက်ထောက်",
      youAsked: "သင်၏မေးခွန်း -",
      aiResponse: "AI ၏ အဖြေ -",
    },
    en: {
      title: "AI-Powered Farming Assistant",
      description: "Have a farming question? Just ask. Our intelligent assistant uses advanced technology to provide you with relevant, accurate agricultural information instantly.",
      features: [
        {
          icon: MessageSquare,
          title: "Natural Conversations",
          description: "Ask questions in your own words. No technical jargon required.",
        },
        {
          icon: Sparkles,
          title: "Smart Responses",
          description: "Get accurate, context-aware answers tailored to your specific situation.",
        },
        {
          icon: Zap,
          title: "Instant Answers",
          description: "Receive immediate responses without waiting for experts to be available.",
        },
      ],
      aiLabel: "AI Assistant",
      youAsked: "You asked:",
      aiResponse: "AI Response:",
    },
  };

  const t = content[language]

  return (
    <section id="ai-assistant" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bot className="w-8 h-8 text-primary" />
                <h2 className="text-3xl sm:text-4xl font-bold">
                  {t.title}
                </h2>
              </div>
              <p className="text-lg text-muted-foreground">
                {t.description}
              </p>
            </div>

            <div className="space-y-4">
              {t.features.map((feature, index) => (
                <Card key={index} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Content - Demo */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md border-border/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-medium">{t.aiLabel}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <p className="text-muted-foreground text-xs mb-1">{t.youAsked}</p>
                      <p>What's the best time to plant rice in my region?</p>
                    </div>

                    <div className="bg-primary/10 rounded-lg p-3 text-sm border border-primary/20">
                      <p className="text-muted-foreground text-xs mb-1">{t.aiResponse}</p>
                      <p>Based on your region's climate, the ideal time to plant rice is typically between April and June, when temperatures are consistently above 20°C. Consider starting seedlings in March for transplanting.</p>
                    </div>

                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <p className="text-muted-foreground text-xs mb-1">{t.youAsked}</p>
                      <p>How much water does rice need?</p>
                    </div>

                    <div className="bg-primary/10 rounded-lg p-3 text-sm border border-primary/20">
                      <p className="text-muted-foreground text-xs mb-1">{t.aiResponse}</p>
                      <p>Rice typically requires 5-10 cm of standing water during the growing season. Maintain consistent water levels, especially during critical growth stages like tillering and flowering.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
