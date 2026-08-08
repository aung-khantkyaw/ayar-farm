import { Button } from "@/components/ui/button"
import { Menu, X, Globe } from "lucide-react"
import { useState } from "react"
import { useLanguage } from "@/lib/LanguageContext"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { language, setLanguage } = useLanguage()

  const navItems = {
    my: [
      { name: "ပင်မစာမျက်နှာ", href: "#home" },
      { name: "အင်္ဂါရပ်များ", href: "#features" },
      { name: "AI လက်ထောက်", href: "#ai-assistant" },
      { name: "အသိုင်းအဝိုင်း", href: "#community" },
      { name: "ဒေါင်းလုဒ်", href: "#download" },
    ],
    en: [
      { name: "Home", href: "#home" },
      { name: "Features", href: "#features" },
      { name: "AI Assistant", href: "#ai-assistant" },
      { name: "Community", href: "#community" },
      { name: "Download", href: "#download" },
    ]
  }

  const currentNavItems = navItems[language]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src="/AyarFarmNotText.png" alt="AyarFarm Link Logo" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-lg">AyarFarm Link</span>
          </div>
 
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {currentNavItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>
 
          {/* Language Toggle */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setLanguage(language === "my" ? "en" : "my")}
            >
              <Globe className="w-4 h-4" />
              {language === "my" ? "မြန်မာ" : "English"}
            </Button>
          </div>
 
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X  className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
 
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {currentNavItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="gap-2 w-fit"
                onClick={() => setLanguage(language === "my" ? "en" : "my")}
              >
                <Globe className="w-4 h-4" />
                {language === "my" ? "မြန်မာ" : "English"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}