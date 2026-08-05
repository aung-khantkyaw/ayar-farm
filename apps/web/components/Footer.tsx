"use client"

import { Separator } from "@/components/ui/separator"
import { Mail } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"
import Image from "next/image"

export function Footer() {
  const { language } = useLanguage()

  const content = {
    my: {
      description: "သင့်အတွက် ယုံကြည်စိတ်ချရသော စိုက်ပျိုးမွေးမြူရေး ဗဟုသုတမျှဝေရာ ပလပ်ဖောင်း။ တောင်သူလယ်သမား အသိုင်းအဝိုင်းနှင့် ချိတ်ဆက်ပါ၊ လေ့လာသင်ယူပါ၊ အတူတကွ တိုးတက်အောင်မြင်လိုက်ပါ။",
      quickLinks: "အမြန်လင့်ခ်များ",
      contact: "ဆက်သွယ်ရန်",
      followUs: "ကျွန်ုပ်တို့ကို Follow လုပ်ထားပါ",
      rights: "© {year} AyarFarm Link. မူပိုင်ခွင့် အပြည့်အဝရှိသည်။",
      address: "Polytechnic University (မအူပင်) - Faculty of Computing\nမအူပင် - မော်လမြိုင်ကျွန်းလမ်း၊ မအူပင်မြို့၊ ဧရာဝတီတိုင်းဒေသကြီး",
    },
    en: {
      description: "Your trusted agricultural knowledge sharing platform. Connect, learn, and grow with the farming community.",
      quickLinks: "Quick Links",
      contact: "Contact",
      followUs: "Follow Us",
      rights: "© {year} AyarFarm Link. All rights reserved.",
      address: "Polytechnic University (Maubin) - Faculty of Computing\nMaubin - Mawlamyinegyun Road, Maubin, Ayeyarwady Region",
    },
  };

  const t = content[language]
  const currentYear = new Date().getFullYear()

  const quickLinks = {
    my: [
      { name: "ပင်မစာမျက်နှာ", href: "#home" },
      { name: "အင်္ဂါရပ်များ", href: "#features" },
      { name: "AI လက်ထောက်", href: "#ai-assistant" },
      { name: "အသိုင်းအဝိုင်း", href: "#community" },
    ],
    en: [
      { name: "Home", href: "#home" },
      { name: "Features", href: "#features" },
      { name: "AI Assistant", href: "#ai-assistant" },
      { name: "Community", href: "#community" },
    ],
  }

  const legalLinks = {
    my: [
      { name: "ကိုယ်ရေးအချက်အလက် လုံခြုံရေးမူဝါဒ", href: "#" },
      { name: "ဝန်ဆောင်မှုဆိုင်ရာ စည်းမျဉ်းများ", href: "#" },
    ],
    en: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
    ],
  }

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image src="/logo.png" alt="AyarFarm Link Logo" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <span className="font-semibold text-lg">AyarFarm Link</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t.quickLinks}</h3>
            <ul className="space-y-2">
              {quickLinks[language].map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">{t.contact}</h3>
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {t.address}
            </div>
          </div>

          {/* Social */}
          {/* <div>
            <h3 className="font-semibold mb-4">{t.followUs}</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div> */}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {t.rights.replace("{year}", currentYear.toString())}
          </p>
          <div className="flex gap-6">
            {legalLinks[language].map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
