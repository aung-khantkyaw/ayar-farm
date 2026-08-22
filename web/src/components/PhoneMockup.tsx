import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "hero" | "showcase";
}

export function PhoneMockup({
  className,
  children,
  variant = "hero",
}: PhoneMockupProps) {
  const sizeClasses =
    variant === "hero"
      ? "w-64 h-[520px] sm:w-72 sm:h-[580px] lg:w-80 lg:h-[640px]"
      : "w-48 h-[400px] sm:w-56 sm:h-[460px]";

  return (
    <div className={cn("relative", className)}>
      {/* Phone Frame */}
      <div
        className={cn(
          "relative mx-auto bg-background rounded-[2.5rem] border-8 border-border shadow-2xl overflow-hidden",
          sizeClasses,
        )}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-border rounded-b-xl z-10" />

        {/* Screen Content */}
        <div className="w-full h-full bg-muted/30 flex items-center justify-center overflow-hidden">
          {children || (
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
                <span className="text-2xl">🌾</span>
              </div>
              <p className="text-sm text-muted-foreground">AyeyarFarm Link</p>
            </div>
          )}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <div className="h-1 w-14 rounded-full bg-zinc-300" />
          </div>
        </div>
      </div>

      {/* Reflection/Shadow */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/10 blur-xl rounded-full" />
    </div>
  );
}
