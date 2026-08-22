import { useEffect, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
0.0;
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  Home,
  AlertTriangle,
  XCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  User,
  ArrowRight,
  Smartphone,
  Mail,
} from "lucide-react";

const AuthConfirm = () => {
  const { confirmation } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      const prevInput = (e.target as HTMLInputElement)
        .previousSibling as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmation(code);
    } catch (error) {
      // Error handled in confirmation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Verification
          </CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to your email/phone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((data, index) => (
                <Input
                  key={index}
                  type="text"
                  maxLength={1}
                  className="w-12 h-12 text-center text-xl font-bold"
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const AuthSuccess = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(10);

  useEffect(() => {
    // Set user info from session
    if (user) {
      setUserInfo(user);
    }
  }, [user]);

  useEffect(() => {
    // Auto redirect countdown
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.navigate({ to: "/" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  const handleContinue = () => {
    router.navigate({ to: "/" });
  };

  const handleAppRedirect = () => {
    // Try to open mobile app
    const appSchemes = [
      "ayarfarm://auth/success",
      "ayarfarm://authenticated",
      "app://ayarfarm/success",
    ];

    appSchemes.forEach((scheme, index) => {
      setTimeout(() => {
        try {
          window.location.href = scheme;
        } catch (error) {
          console.error("Failed to open app scheme:", scheme);
        }
      }, index * 1000);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8fffe] to-[#f0f9ff]">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            အကောင့်အတည်ပြုပြီးပါပြီ!
          </CardTitle>
          <CardDescription className="text-base">
            <span className="text-[#53B154] font-semibold">AyeyarFarm</span> မှ
            ကြိုဆိုပါတယ်!
            <br />
            သင့်အကောင့်ကို အောင်မြင်စွာ အတည်ပြုပြီးပါပြီ
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Info Display */}
          {userInfo && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg space-y-3">
              <div className="flex items-center space-x-3">
                {userInfo.profile_picture ? (
                  <img
                    src={userInfo.profile_picture}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#53B154] to-[#4FC3F7] flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {userInfo.name || userInfo.email || userInfo.phone_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    {userInfo.email || userInfo.phone_number}
                  </p>
                </div>
              </div>

              {userInfo.user_type && (
                <div className="flex items-center justify-between pt-2 border-t border-white/50">
                  <span className="text-sm text-gray-600">အမျိုးအစား:</span>
                  <span className="text-sm font-medium text-[#53B154]">
                    {userInfo.user_type}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Welcome Message */}
          <div className="text-center space-y-2">
            <h4 className="font-semibold text-gray-900">
              AyeyarFarm ကို အသုံးပြုရန် အဆင်သင့်ဖြစ်ပါပြီ
            </h4>
            <p className="text-sm text-gray-600">
              လယ်သမားများအတွက် ဗဟုသုတ၊ စျေးနှုန်းအချက်အလက်များနှင့်
              အခြားအသုံးဝင်သော ဝန်ဆောင်မှုများကို ရယူနိုင်ပါပြီ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-[#53B154] to-[#4FC3F7] hover:from-[#388e3c] hover:to-[#0288d1] text-white py-3 text-base font-semibold"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              AyeyarFarm စတင်သုံးမယ်
            </Button>

            <Button
              onClick={handleAppRedirect}
              variant="outline"
              className="w-full py-3 border-2 border-[#53B154] text-[#53B154] hover:bg-[#53B154] hover:text-white"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Mobile App ဖွင့်မယ်
            </Button>

            <Button
              onClick={() => router.navigate({ to: "/" })}
              variant="ghost"
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              <Home className="mr-2 h-4 w-4" />
              မူလစာမျက်နှာသို့သွားမယ်
            </Button>
          </div>

          {/* Auto redirect notice */}
          <div className="text-center text-xs text-gray-500">
            {countdownSeconds > 0 ? (
              <p>
                {countdownSeconds} စက္ကန့်အကြာတွင် အလိုအလျောက် မူလစာမျက်နှာသို့
                သွားပါမည်
              </p>
            ) : (
              <p>ပြန်ညွှန်းနေပါသည်...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AuthError = () => {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [manualIdentifier, setManualIdentifier] = useState("");
  const [showInput, setShowInput] = useState(false);

  const handleResendConfirmation = async () => {
    setIsResending(true);
    try {
      // Try multiple sources to get the identifier
      let identifier =
        manualIdentifier ||
        localStorage.getItem("pending_confirmation_identifier");

      // If not in localStorage, try to get from URL parameters
      if (!identifier) {
        const urlParams = new URLSearchParams(window.location.search);
        identifier = urlParams.get("email") || urlParams.get("phone_number");
      }

      // If still not found, try to get from hash parameters (for mobile app redirects)
      if (!identifier) {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        identifier = hashParams.get("email") || hashParams.get("phone_number");
      }

      // If still not found, try to get from sessionStorage
      if (!identifier) {
        identifier =
          sessionStorage.getItem("signup_identifier") ||
          sessionStorage.getItem("pending_confirmation_identifier");
      }

      if (!identifier) {
        setShowInput(true);
        toast.error("အီးမေးလ် သို့မဟုတ် ဖုန်းနံပါတ် လိုအပ်ပါသည်။");
        return;
      }

      const isEmail = identifier.includes("@");
      const payload = isEmail
        ? { email: identifier }
        : { phone_number: identifier };

      await api.post("/auth/resend-otp", payload);

      // Save identifier for future use
      localStorage.setItem("pending_confirmation_identifier", identifier);
      sessionStorage.setItem("pending_confirmation_identifier", identifier);

      toast.success(`အတည်ပြုကုဒ် ${identifier} သို့ ပို့ပြီးပါပြီ။`);
      setShowInput(false);
    } catch (error: any) {
      console.error("Resend error:", error);

      // Handle specific error cases
      if (error?.message?.includes("rate_limit")) {
        toast.error(
          "အတည်ပြုလင့်ပို့မှု များလွန်းပါသည်။ ၅ မိနစ်အကြာတွင် ပြန်လည်ကြိုးစားပါ။",
        );
      } else if (error?.message?.includes("not_found")) {
        toast.error("ဤအချက်အလက်နှင့် မည်သည့်အကောင့်မျှ မရှိပါ။");
      } else {
        toast.error(
          "လင့်ပို့မှုမအောင်မြင်ပါ။ အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ပြန်လည်ကြိုးစားပါ။",
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-16 w-28 h-28 bg-red-300 rounded-full animate-pulse"></div>
        <div className="absolute top-48 right-24 w-20 h-20 bg-pink-300 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-24 left-24 w-16 h-16 bg-orange-300 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-48 right-16 w-24 h-24 bg-red-200 rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-1/3 left-1/3 w-12 h-12 bg-pink-200 rounded-full animate-pulse delay-300"></div>
      </div>

      <Card className="w-full max-w-lg mx-4 shadow-2xl border-0 bg-white/95 backdrop-blur-lg relative z-10">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-8">
            {/* Error Icon with Animation */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-28 h-28 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <XCircle className="w-14 h-14 text-white animate-bounce" />
                </div>
                {/* Error Animation Rings */}
                <div className="absolute inset-0 w-28 h-28 border-4 border-red-300 rounded-full animate-ping opacity-30"></div>
                <div className="absolute inset-0 w-28 h-28 border-4 border-pink-300 rounded-full animate-ping opacity-20 delay-500"></div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2 bg-red-100 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-700">
                  အတည်ပြုမှုမအောင်မြင်ပါ
                </span>
              </div>
            </div>

            {/* Main Message */}
            <div className="space-y-4">
              <p className="text-gray-600 text-lg">
                သင့်အကောင့်အတည်ပြုမှုတွင် ပြဿနာတစ်ခုဖြစ်ပွားခဲ့သည်
              </p>
            </div>

            {/* Error Analysis */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0 animate-pulse" />
                <div className="space-y-3 text-left">
                  <h3 className="font-semibold text-orange-800">
                    ဖြစ်နိုင်သောအကြောင်းရင်းများ:
                  </h3>
                  <ul className="text-sm text-orange-700 space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>အတည်ပြုကုဒ်၏ သက်တမ်းကုန်ပါပြီ (၁၀ မိနစ်)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>ကုဒ်မမှန်ကန်ပါ</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>
                        အကောင့်ကို ပြီးခဲ့သည့်အချိန်တွင် အတည်ပြုပြီးပါပြီ
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>အင်တာနက်ချိတ်ဆက်မှု သို့မဟုတ် ဆာဗာပြဿနာ</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Solutions Section */}
            <div className="space-y-4">
              {/* Identifier Input Form */}
              {showInput && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="text-center">
                    <h4 className="font-medium text-gray-800 text-sm">
                      အီးမေးလ် သို့မဟုတ် ဖုန်းနံပါတ် ရိုက်ထည့်ပါ
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      signup လုပ်ခဲ့သည့် အချက်အလက်ကို ရိုက်ထည့်ပါ
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="identifier"
                      className="text-sm font-medium text-gray-700"
                    >
                      အီးမေးလ် သို့မဟုတ် ဖုန်းနံပါတ်
                    </Label>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="email@example.com or +1234567890"
                      value={manualIdentifier}
                      onChange={(e) => setManualIdentifier(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleResendConfirmation}
                  disabled={isResending || (showInput && !manualIdentifier)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 text-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  size="lg"
                >
                  <RefreshCw
                    className={`mr-3 h-5 w-5 ${isResending ? "animate-spin" : ""}`}
                  />
                  {isResending
                    ? "ပို့နေပါသည်..."
                    : showInput && !manualIdentifier
                      ? "အချက်အလက်ရိုက်ထည့်ပါ"
                      : "အတည်ပြုကုဒ်အသစ်တောင်းခံမယ်"}
                </Button>

                {!showInput && (
                  <Button
                    onClick={() => setShowInput(true)}
                    variant="outline"
                    className="w-full py-3 border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white transition-all duration-200"
                    size="lg"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    အီးမေးလ်/ဖုန်းနံပါတ် ရိုက်ထည့်မယ်
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => router.navigate({ to: "/login" })}
                    variant="outline"
                    className="py-3 border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-200"
                    size="lg"
                  >
                    <User className="w-4 h-4 mr-2" />
                    လော့ဂ်အင်ဝင်
                  </Button>

                  <Button
                    onClick={() => router.navigate({ to: "/" })}
                    variant="outline"
                    className="py-3 border-2 border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white transition-all duration-200"
                    size="lg"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    မူလစာမျက်နှာ
                  </Button>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center space-y-3">
                <h4 className="font-medium text-blue-800 flex items-center justify-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>အကူအညီလိုအပ်ပါသလား?</span>
                </h4>
                <p className="text-sm text-blue-700">
                  ပြဿနာဆက်လက်ဖြစ်ပွားနေလျှင် နည်းပညာပံ့ပိုးမှုအဖွဲ့နှင့်
                  ဆက်သွယ်ပါ
                </p>
                <div className="space-y-2">
                  <Button
                    variant="link"
                    className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
                    onClick={() =>
                      (window.location.href = "mailto:support@ayarfarmlink.com")
                    }
                  >
                    📧 support@ayarfarmlink.com
                  </Button>
                  <p className="text-xs text-blue-600">
                    သို့မဟုတ် အွန်လိုင်းအကူအညီစာရွက်စာတမ်းများကို ကြည့်ရှုပါ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate({ to: "/" });
  };

  const handleLoginRedirect = () => {
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-gray-950 dark:via-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Animated Security Icons */}
        <div className="relative">
          <div className="flex justify-center items-center space-x-4 mb-8">
            <Shield className="w-12 h-12 text-red-500 animate-bounce delay-0" />
            <AlertTriangle className="w-10 h-10 text-orange-600 animate-bounce delay-100" />
            <Shield className="w-8 h-8 text-red-400 animate-bounce delay-200" />
          </div>

          {/* 401 Number with Security Theme */}
          <div className="relative">
            <h1 className="text-8xl md:text-9xl font-bold text-red-600 dark:text-red-400 opacity-20 select-none">
              401
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-full p-6 shadow-lg border-4 border-red-200 dark:border-red-800">
                <Shield className="w-16 h-16 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              သင့်တွင် ဤအရင်းအမြစ်ကို အသုံးပြုရန် ခွင့်ပြုချက်မရှိပါ။
              ကျေးဇူးပြု၍ လော့ဂ်အင်ဝင်ပါ။
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleLoginRedirect}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white min-w-[160px] group"
            >
              <User className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              လော့ဂ်အင်ဝင်မယ်
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              size="lg"
              className="min-w-[160px] group border-red-300 hover:border-red-500 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950"
            >
              <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              မူလစာမျက်နှာ
            </Button>
          </div>

          {/* Requirements Section */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              ဝင်ရောက်ရန် လိုအပ်သည်များ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center gap-2 p-3 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <span className="text-sm text-center">
                  တရားဝင် အကောင့်ဖြင့် လော့ဂ်အင်ဝင်ခြင်း
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <span className="text-sm text-center">
                  လိုအပ်သော ခွင့်ပြုချက်များ ရရှိခြင်း
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <span className="text-sm text-center">
                  AyeyarFarmLink Team အဖွဲ့ဝင်ဖြစ်ခြင်း
                </span>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50/60 dark:bg-blue-900/30 backdrop-blur-sm rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 flex items-center justify-center space-x-2 mb-3">
              <AlertCircle className="w-4 h-4" />
              <span>အကူအညီလိုအပ်ပါသလား?</span>
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              ပြဿနာဆက်လက်ဖြစ်ပွားနေလျှင် နည်းပညာပံ့ပိုးမှုအဖွဲ့နှင့် ဆက်သွယ်ပါ
            </p>
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
              onClick={() =>
                (window.location.href = "mailto:support@ayarfarmlink.com")
              }
            >
              📧 support@ayarfarmlink.com
            </Button>
          </div>
        </div>

        {/* Footer Message */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            လုံခြုံရေးကို အရေးထားပါသည်။ သင့်ဒေတာကို ကာကွယ်ပေးပါသည်။
          </p>
          <div className="flex justify-center items-center mt-4 space-x-2">
            <Shield className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
              AyeyarFarm - လုံခြုံစိတ်ချရသော စိုက်ပျိုးရေး
            </span>
            <Shield className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 opacity-10 dark:opacity-5">
          <Shield className="w-20 h-20 text-red-600 animate-spin-slow" />
        </div>
        <div className="absolute bottom-10 right-10 opacity-10 dark:opacity-5">
          <AlertTriangle className="w-16 h-16 text-orange-600 animate-bounce" />
        </div>
        <div className="absolute top-1/4 right-20 opacity-10 dark:opacity-5">
          <User className="w-12 h-12 text-red-500 animate-pulse" />
        </div>
        <div className="absolute bottom-1/4 left-20 opacity-10 dark:opacity-5">
          <CheckCircle className="w-14 h-14 text-green-500 animate-bounce delay-500" />
        </div>
      </div>
    </div>
  );
};

export { AuthConfirm, AuthSuccess, AuthError, UnauthorizedPage };
