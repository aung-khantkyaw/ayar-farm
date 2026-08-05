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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

const resetPasswordSchema = z
  .object({
    code: z.string().min(1, "OTP code is required"),
    new_password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const identifier = searchParams.get("identifier") || ""
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: "",
      new_password: "",
      confirm_password: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    if (!identifier) {
      toast.error(
        "Missing identifier. Please try again from the forgot password page."
      )
      return
    }

    setIsLoading(true)
    try {
      const isEmail = identifier.includes("@")
      const payload = {
        code: values.code,
        new_password: values.new_password,
        ...(isEmail ? { email: identifier } : { phone_number: identifier }),
      }

      await api.post("/auth/reset-password", payload)
      toast.success("Password reset successfully")
      router.push("/login")
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          {identifier && (
            <CardDescription>
              Enter the code sent to{" "}
              <span className="font-medium text-foreground">{identifier}</span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OTP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter OTP code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
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
