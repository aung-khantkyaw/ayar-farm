"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MessageCircle, Share2, Heart } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

export function Community() {
  const { language } = useLanguage()

  const content = {
  my: {
    title: "တောင်သူလယ်သမား အသိုင်းအဝိုင်းတွင် ပါဝင်လိုက်ပါ",
    description: "ထောင်ပေါင်းများစွာသော တောင်သူများနှင့် ချိတ်ဆက်ပြီး ဗဟုသုတများကို မျှဝေပါ၊ သိလိုသည်များကို မေးမြန်းကာ အတူတကွ တိုးတက်အောင်မြင်မှုများကို ရယူလိုက်ပါ။",
    stats: {
      activeFarmers: "တက်ကြွစွာ အသုံးပြုနေသော တောင်သူများ",
      knowledgeShared: "မျှဝေထားသော ဗဟုသုတများ",
      questionsAnswered: "ဖြေဆိုထားသော မေးခွန်းများ",
      satisfactionRate: "အသုံးပြုသူ ကျေနပ်မှုနှုန်း",
    },
  },
  en: {
    title: "Join the Farmer Community",
    description: "Connect with thousands of farmers, share knowledge, ask questions, and grow together.",
    stats: {
      activeFarmers: "Active Farmers",
      knowledgeShared: "Knowledge Shared",
      questionsAnswered: "Questions Answered",
      satisfactionRate: "Satisfaction Rate",
    },
  },
};

  const t = content[language]

  const posts = [
    {
      author: "Mg Aung",
      time: "2 hours ago",
      content: "Just harvested my first organic rice crop! The techniques I learned from this community made all the difference.",
      likes: 45,
      comments: 12,
      category: "Success Story",
    },
    {
      author: "Daw Mya",
      time: "5 hours ago",
      content: "Does anyone have experience with drip irrigation for vegetable farming? Looking for recommendations.",
      likes: 23,
      comments: 18,
      category: "Question",
    },
    {
      author: "Ko Kyaw",
      time: "1 day ago",
      content: "Market prices for pulses are trending upward. Great time to sell if you have stock!",
      likes: 67,
      comments: 8,
      category: "Market Update",
    },
  ]

  return (
    <section id="community" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {posts.map((post, index) => (
            <Card key={index} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-xs text-muted-foreground">{post.time}</span>
                </div>
                <CardTitle className="text-base">{post.author}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{post.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 text-center">
            <CardContent className="p-6">
              <Users className="w-8 h-8 mx-auto mb-3 text-primary" />
              <div className="text-2xl font-bold mb-1">10K+</div>
              <p className="text-sm text-muted-foreground">{t.stats.activeFarmers}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 text-center">
            <CardContent className="p-6">
              <Share2 className="w-8 h-8 mx-auto mb-3 text-primary" />
              <div className="text-2xl font-bold mb-1">5K+</div>
              <p className="text-sm text-muted-foreground">{t.stats.knowledgeShared}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 text-center">
            <CardContent className="p-6">
              <MessageCircle className="w-8 h-8 mx-auto mb-3 text-primary" />
              <div className="text-2xl font-bold mb-1">50K+</div>
              <p className="text-sm text-muted-foreground">{t.stats.questionsAnswered}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 text-center">
            <CardContent className="p-6">
              <Heart className="w-8 h-8 mx-auto mb-3 text-primary" />
              <div className="text-2xl font-bold mb-1">98%</div>
              <p className="text-sm text-muted-foreground">{t.stats.satisfactionRate}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
