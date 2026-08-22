import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Home,
  ArrowLeft,
  Sprout,
  Leaf,
  Fish,
  Tractor,
  Wheat,
} from "lucide-react";

export function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate({ to: "/" });
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-green-950 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Animated Farm Icons */}
        <div className="relative">
          <div className="flex justify-center items-center space-x-4 mb-8">
            <Sprout className="w-12 h-12 text-green-500 animate-bounce delay-0" />
            <Leaf className="w-10 h-10 text-emerald-600 animate-bounce delay-100" />
            <Sprout className="w-8 h-8 text-green-400 animate-bounce delay-200" />
          </div>

          {/* 404 Number with Farm Theme */}
          <div className="relative">
            <h1 className="text-8xl md:text-9xl font-bold text-green-600 dark:text-green-400 opacity-20 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-full p-6 shadow-lg border-4 border-green-200 dark:border-green-800">
                <Sprout className="w-16 h-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Oops! This field is empty
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              It looks like the page you're looking for has grown somewhere
              else. Let's help you find your way back to the farm!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleGoHome}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white min-w-[160px] group"
            >
              <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Back to Farm
            </Button>

            <Button
              onClick={handleGoBack}
              variant="outline"
              size="lg"
              className="min-w-[160px] group border-green-300 hover:border-green-500 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-950"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>
          </div>
        </div>

        {/* Footer Message */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lost in the fields? Don't worry, every farmer loses their way
            sometimes.
          </p>
          <div className="flex justify-center items-center mt-4 space-x-2">
            <Leaf className="w-4 h-4 text-green-500 animate-pulse" />
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              AyeyarFarm - Growing Together
            </span>
            <Leaf className="w-4 h-4 text-green-500 animate-pulse" />
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 opacity-10 dark:opacity-5">
          <Tractor className="w-20 h-20 text-green-600 animate-spin-slow" />
        </div>
        <div className="absolute bottom-10 right-10 opacity-10 dark:opacity-5">
          <Leaf className="w-16 h-16 text-emerald-600 animate-bounce" />
        </div>
        <div className="absolute top-1/4 right-20 opacity-10 dark:opacity-5">
          <Fish className="w-12 h-12 text-blue-500 animate-pulse" />
        </div>
        <div className="absolute bottom-1/4 left-20 opacity-10 dark:opacity-5">
          <Wheat className="w-14 h-14 text-amber-500 animate-bounce delay-500" />
        </div>
      </div>
    </div>
  );
}
