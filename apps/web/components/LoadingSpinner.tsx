import {
  Wheat,
  Sprout,
  Leaf,
  TreePine,
  Fish,
  Truck,
  Wrench,
  Bug,
  Flower,
  Apple,
  Carrot,
  Tractor,
  Scissors,
  Shovel,
} from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="loading-spinner flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 dark:from-gray-900 dark:to-emerald-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 opacity-20 animate-bounce">
          <Wheat className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="absolute top-1/3 right-1/4 opacity-20 animate-pulse">
          <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 opacity-20 animate-bounce delay-500">
          <Sprout className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="absolute bottom-1/3 right-1/3 opacity-20 animate-pulse delay-1000">
          <TreePine className="w-5 h-5 text-green-700 dark:text-green-300" />
        </div>

        <div className="absolute top-20 left-1/2 opacity-15 animate-pulse delay-300">
          <Apple className="w-6 h-6 text-red-500 dark:text-red-400" />
        </div>
        <div className="absolute top-1/2 left-20 opacity-15 animate-bounce delay-700">
          <Carrot className="w-5 h-5 text-orange-500 dark:text-orange-400" />
        </div>
        <div className="absolute bottom-20 right-20 opacity-15 animate-pulse delay-1200">
          <Flower className="w-6 h-6 text-pink-500 dark:text-pink-400" />
        </div>

        <div className="absolute top-16 right-1/3 opacity-15 animate-bounce delay-400">
          <Fish className="w-7 h-7 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="absolute bottom-16 left-1/4 opacity-15 animate-pulse delay-800">
          <Bug className="w-4 h-4 text-amber-700 dark:text-amber-500" />
        </div>

        <div className="absolute top-1/2 right-16 opacity-10 animate-pulse delay-600">
          <Tractor className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
        </div>
        <div className="absolute bottom-1/2 left-16 opacity-10 animate-bounce delay-900">
          <Truck className="w-7 h-7 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="absolute top-12 left-12 opacity-15 animate-pulse delay-1100">
          <Shovel className="w-5 h-5 text-brown-600 dark:text-yellow-700" />
        </div>
        <div className="absolute bottom-12 right-12 opacity-15 animate-bounce delay-1300">
          <Wrench className="w-5 h-5 text-gray-700 dark:text-gray-500" />
        </div>
        <div className="absolute top-3/4 left-1/2 opacity-10 animate-pulse delay-1500">
          <Scissors className="w-4 h-4 text-red-600 dark:text-red-500" />
        </div>
      </div>

      <div className="relative flex flex-col items-center space-y-6">
        {/* Main loading animation */}
        <div className="relative">
          {/* Outer growth ring */}
          <div className="w-32 h-32 border-4 border-green-200 dark:border-green-700 rounded-full animate-pulse">
            <div className="absolute inset-2 border-4 border-transparent border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin"></div>

            {/* Inner core with plant icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                <Sprout className="w-8 h-8 text-white animate-bounce" />
              </div>
            </div>

            {/* Orbiting seeds */}
            <div
              className="absolute inset-0 animate-spin"
              style={{ animationDuration: "3s" }}
            >
              <div className="absolute -top-2 left-1/2 w-3 h-3 bg-amber-500 dark:bg-amber-400 rounded-full transform -translate-x-1/2 shadow-lg"></div>
              <div className="absolute -bottom-2 left-1/2 w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full transform -translate-x-1/2 shadow-lg"></div>
              <div className="absolute top-1/2 -left-2 w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full transform -translate-y-1/2 shadow-lg"></div>
              <div className="absolute top-1/2 -right-2 w-3 h-3 bg-lime-500 dark:bg-lime-400 rounded-full transform -translate-y-1/2 shadow-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
