import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CloudSun,
  ShoppingCart,
  Wind,
  Droplets,
  ThermometerSun,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface MarketItem {
  product: string;
  unit: string;
  price: string;
}

interface MarketData {
  market: string;
  items: MarketItem[];
}

interface WeatherCurrent {
  temperature: string;
  location: string;
  humidity: string;
  wind: string;
  status: string;
  time: string;
  unit: string;
}

interface WeatherForecast {
  day: string;
  high: string;
  low: string;
  status: string;
  windSpeed: string;
  windDirection: string;
}

interface WeatherData {
  source: string;
  current: WeatherCurrent;
  forecast: WeatherForecast[];
}

const getWeatherIcon = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("sun") || s.includes("clear"))
    return <Sun className="h-6 w-6 text-amber-500" />;
  if (s.includes("rain") || s.includes("shower") || s.includes("drizzle"))
    return <CloudRain className="h-6 w-6 text-blue-500" />;
  if (s.includes("storm") || s.includes("thunder"))
    return <CloudLightning className="h-6 w-6 text-purple-500" />;
  if (s.includes("snow")) return <CloudSnow className="h-6 w-6 text-sky-300" />;
  if (s.includes("fog") || s.includes("mist"))
    return <CloudFog className="h-6 w-6 text-slate-400" />;
  if (s.includes("cloud") || s.includes("overcast"))
    return <Cloud className="h-6 w-6 text-slate-400" />;
  return <CloudSun className="h-6 w-6 text-blue-400" />;
};

export function MarketWeather() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [weatherYangon, setWeatherYangon] = useState<WeatherData | null>(null);
  const [weatherMandalay, setWeatherMandalay] = useState<WeatherData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const marketRes = await fetch(
          `${import.meta.env.VITE_MARKET_API}/api/market`,
        );
        if (!marketRes.ok) throw new Error("Failed to fetch market data");
        const marketJson = await marketRes.json();
        setMarketData(marketJson);

        const weatherYangonRes = await fetch(
          `${import.meta.env.VITE_WEATHER_API}/v2/weather/yangon`,
        );
        if (!weatherYangonRes.ok)
          throw new Error("Failed to fetch weather data for Yangon");
        const weatherYangonJson = await weatherYangonRes.json();
        setWeatherYangon(weatherYangonJson);

        const weatherMandalayRes = await fetch(
          `${import.meta.env.VITE_WEATHER_API}/v2/weather/mandalay`,
        );
        if (!weatherMandalayRes.ok)
          throw new Error("Failed to fetch weather data for Mandalay");
        const weatherMandalayJson = await weatherMandalayRes.json();
        setWeatherMandalay(weatherMandalayJson);
      } catch (error) {
        console.error("Failed to fetch market/weather data", error);
        setError(
          "Failed to load market and weather data. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Prices */}
        <Card className="h-[600px] flex flex-col relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-0 shadow-lg hover:shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-bl-full"></div>
          <CardHeader className="pb-3 border-b border-emerald-100/50 bg-white/50 backdrop-blur-sm relative z-10">
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
              </div>
              Market Prices
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0 relative z-10">
            <LoadingSpinner />
          </CardContent>
        </Card>

        {/* Weather */}
        <Card className="h-[600px] flex flex-col relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 border-0 shadow-lg hover:shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-bl-full"></div>
          <CardHeader className="pb-3 border-b border-blue-100/50 bg-white/50 backdrop-blur-sm relative z-10">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CloudSun className="h-5 w-5 text-blue-600" />
              </div>
              Weather Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative z-10">
            <LoadingSpinner />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Prices */}
        <Card className="h-[600px] flex flex-col relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-0 shadow-lg hover:shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-bl-full"></div>
          <CardHeader className="pb-3 border-b border-emerald-100/50 bg-white/50 backdrop-blur-sm relative z-10">
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
              </div>
              Market Prices
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0 relative z-10">
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <ShoppingCart className="h-10 w-10 opacity-20" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>

        {/* Weather */}
        <Card className="h-[600px] flex flex-col relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 border-0 shadow-lg hover:shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-bl-full"></div>
          <CardHeader className="pb-3 border-b border-blue-100/50 bg-white/50 backdrop-blur-sm relative z-10">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CloudSun className="h-5 w-5 text-blue-600" />
              </div>
              Weather Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative z-10">
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <CloudSun className="h-10 w-10 opacity-20" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Market Prices */}
      <Card className="h-[600px] flex flex-col relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-0 shadow-lg hover:shadow-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-bl-full"></div>
        <CardHeader className="pb-3 border-b border-emerald-100/50 bg-white/50 backdrop-blur-sm relative z-10">
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span>Market Prices</span>
              <span className="text-[10px] text-emerald-600/70 font-medium font-normal">
                Source: HtwetToe.com
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 relative z-10">
          {marketData.length > 0 ? (
            <Tabs
              defaultValue={marketData[0]?.market}
              className="h-full flex flex-col"
            >
              <div className="px-4 pt-4">
                <TabsList className="w-full justify-start overflow-x-auto bg-white/30 backdrop-blur-md border border-emerald-100/50 rounded-xl p-1.5 h-auto gap-2">
                  {marketData.map((m) => (
                    <TabsTrigger
                      key={m.market}
                      value={m.market}
                      className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 px-4 py-2 rounded-lg transition-all hover:bg-white/40 font-medium"
                    >
                      {m.market}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {marketData.map((m) => (
                <TabsContent
                  key={m.market}
                  value={m.market}
                  className="flex-1 overflow-y-auto p-4 mt-0"
                >
                  <div className="grid gap-3">
                    {m.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-white/80 backdrop-blur-sm border border-emerald-100/50 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                            {item.product}
                          </span>
                          <span className="text-xs font-medium text-slate-500 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                            {item.unit}
                          </span>
                        </div>
                        <div className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                          {item.price}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <ShoppingCart className="h-10 w-10 opacity-20" />
              <p>No market data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weather */}
      <Card className="h-[600px] flex flex-col relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 border-0 shadow-lg hover:shadow-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-bl-full"></div>
        <CardHeader className="pb-3 border-b border-blue-100/50 bg-white/50 backdrop-blur-sm relative z-10">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <CloudSun className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span>Weather Forecast</span>
              <span className="text-[10px] text-blue-600/70 font-medium font-normal">
                Source: {weatherYangon?.source}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden relative z-10">
          <Tabs defaultValue="yangon" className="h-full flex flex-col">
            <div className="px-4 pt-4">
              <TabsList className="grid w-full grid-cols-2 bg-blue-100/50 p-1 h-auto">
                <TabsTrigger
                  value="yangon"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700 py-2 rounded-md shadow-none data-[state=active]:shadow-sm transition-all hover:bg-white/50"
                >
                  Yangon
                </TabsTrigger>
                <TabsTrigger
                  value="mandalay"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700 py-2 rounded-md shadow-none data-[state=active]:shadow-sm transition-all hover:bg-white/50"
                >
                  Mandalay
                </TabsTrigger>
              </TabsList>
            </div>

            {[
              { city: "yangon", data: weatherYangon },
              { city: "mandalay", data: weatherMandalay },
            ].map(({ city, data }) => (
              <TabsContent
                key={city}
                value={city}
                className="flex-1 overflow-y-auto px-4 py-2 mt-0"
              >
                {data ? (
                  <div className="space-y-4">
                    {/* Current Weather */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 rounded-2xl text-white shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10 blur-xl"></div>

                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-xl font-bold tracking-tight">
                              {data.current.location}
                            </h3>
                          </div>
                          <p className="text-blue-100 text-sm font-medium flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            {data.current.status}
                          </p>
                        </div>

                        <div className="flex items-center justify-between bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                              <ThermometerSun className="h-4 w-4 text-blue-100" />
                            </div>
                            <div>
                              <p className="text-[10px] text-blue-200">Temp</p>
                              <p className="text-sm font-semibold">
                                {data.current.temperature}°
                                {data.current.unit === "Celsius" ? "C" : "F"}
                              </p>
                            </div>
                          </div>
                          <div className="w-px h-8 bg-white/10"></div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                              <Droplets className="h-4 w-4 text-blue-100" />
                            </div>
                            <div>
                              <p className="text-[10px] text-blue-200">
                                Humidity
                              </p>
                              <p className="text-sm font-semibold">
                                {data.current.humidity}
                              </p>
                            </div>
                          </div>
                          <div className="w-px h-8 bg-white/10"></div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                              <Wind className="h-4 w-4 text-blue-100" />
                            </div>
                            <div>
                              <p className="text-[10px] text-blue-200">Wind</p>
                              <p className="text-sm font-semibold">
                                {data.current.wind}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Forecast */}
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                        7-Day Forecast
                      </h4>
                      <div className="flex overflow-x-auto gap-2 sm:gap-4 pb-4">
                        {data.forecast.map((day, idx) => (
                          <div
                            key={idx}
                            className="min-w-[100px] sm:min-w-[120px] flex-1 flex flex-col items-center justify-between p-3 bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-xl hover:shadow-md hover:border-blue-200 transition-all group text-center"
                          >
                            <div className="font-semibold text-slate-700 mb-2">
                              {day.day}
                            </div>
                            <div className="mb-2">
                              {getWeatherIcon(day.status)}
                            </div>
                            <div className="text-xs font-medium text-slate-500 group-hover:text-blue-600 transition-colors mb-3 line-clamp-2 h-8 flex items-center justify-center">
                              {day.status}
                            </div>
                            <div className="flex items-center gap-1 text-sm font-medium bg-blue-50 px-2 py-1 rounded-lg mb-2">
                              <span className="text-slate-800">
                                {day.high}°
                              </span>
                              <span className="text-slate-400 text-xs">/</span>
                              <span className="text-slate-500">{day.low}°</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Wind className="h-3 w-3" />
                              <span>
                                {day.windSpeed}km/h {day.windDirection}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <CloudSun className="h-10 w-10 opacity-20" />
                    <p>No weather data available</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
