"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const forgotPasswordSchema = z.object({
  identifier: z.string().refine((val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^\+?[0-9]{7,15}$/
    return emailRegex.test(val) || phoneRegex.test(val)
  }, "Must be a valid email or phone number"),
})

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      identifier: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    setIsLoading(true)
    try {
      const isEmail = values.identifier.includes("@")
      const payload = isEmail
        ? { email: values.identifier }
        : { phone_number: values.identifier }

      await api.post("/auth/forgot-password", payload)
      toast.success("Reset code sent successfully")

      // Navigate to reset password page with identifier
      router.push(`/reset-password?identifier=${values.identifier}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email or Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email@example.com or +1234567890"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Code
              </Button>
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
