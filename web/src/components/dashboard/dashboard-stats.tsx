import { useCrop } from "@/context/crop-context";
import { useLivestock } from "@/context/livestock-context";
import { useFishery } from "@/context/fishery-context";
import { useMachine } from "@/context/machine-context";
import { useAdmin } from "@/providers/admin-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, FileText, Users } from "lucide-react";
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function DashboardStats() {
  const [articles, setArticles] = useState<any[]>([]);
  const [agrometBulletins, setAgrometBulletins] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const {
    crops,
    cropTypes,
    fetchCrops,
    fetchCropTypes,
    documents: cropDocs,
    fetchDocuments: fetchCropDocs,
  } = useCrop();
  const {
    livestocks,
    fetchLivestock,
    documents: livestockDocs,
    fetchDocuments: fetchLivestockDocs,
  } = useLivestock();
  const {
    fisheries,
    fetchFisheries,
    documents: fisheryDocs,
    fetchDocuments: fetchFisheryDocs,
  } = useFishery();
  const {
    machines,
    machineTypes,
    fetchMachines,
    fetchMachineTypes,
    documents: machineDocs,
    fetchDocuments: fetchMachineDocs,
  } = useMachine();
  const { users } = useAdmin();

  useEffect(() => {
    const fetchResources = async () => {
      try {
        // Fetch articles
        const articlesRes = await api.get("/document/documents?article=true");
        if (articlesRes && articlesRes.documents) {
          setArticles(articlesRes.documents);
        }

        // Fetch agromet bulletins
        const bulletinsRes = await api.get("/document/documents?agromet_bulletin=true");
        if (bulletinsRes && bulletinsRes.documents) {
          setAgrometBulletins(bulletinsRes.documents);
        }

        // Fetch other resources (videos and applications)
        const res = await api.get("/resources/resources");
        if (res && res.resources) {
          setResources(res.resources);
        }
      } catch (error) {
        console.error("Failed to fetch resources", error);
      }
    };
    fetchResources();

    fetchCrops();
    fetchCropTypes();
    fetchCropDocs();

    fetchLivestock();
    fetchLivestockDocs();

    fetchFisheries();
    fetchFisheryDocs();

    fetchMachines();
    fetchMachineTypes();
    fetchMachineDocs();
  }, []);

  // Category Stats
  const categoryData = [
    { subject: "Crops", count: crops.length, fullMark: 100 },
    { subject: "Crop Types", count: cropTypes.length, fullMark: 100 },
    { subject: "Livestock", count: livestocks.length, fullMark: 100 },
    { subject: "Fishery", count: fisheries.length, fullMark: 100 },
    { subject: "Machines", count: machines.length, fullMark: 100 },
    { subject: "Machine Types", count: machineTypes.length, fullMark: 100 },
  ];

  // Resource Stats
  const resourceData = [
    {
      subject: "Article",
      count: articles.length,
      fullMark: 100,
    },
    {
      subject: "Agromet",
      count: agrometBulletins.length,
      fullMark: 100,
    },
    {
      subject: "Video",
      count: resources.filter((r) => r.type === "VIDEO").length,
      fullMark: 100,
    },
    {
      subject: "Application",
      count: resources.filter((r) => r.type === "APPLICATION").length,
      fullMark: 100,
    },
    { subject: "Crop Docs", count: cropDocs.length, fullMark: 100 },
    { subject: "Livestock Docs", count: livestockDocs.length, fullMark: 100 },
    { subject: "Fishery Docs", count: fisheryDocs.length, fullMark: 100 },
    { subject: "Machine Docs", count: machineDocs.length, fullMark: 100 },
  ];
  // User Type Stats
  const userTypeData = [
    {
      subject: "Admin",
      count: users.filter((u) => u.user_type === "ADMIN").length,
      fullMark: 100,
    },
    {
      subject: "Farmer",
      count: users.filter((u) => u.user_type === "FARMER").length,
      fullMark: 100,
    },
    {
      subject: "Agri Spec",
      count: users.filter((u) => u.user_type === "AGRICULTURAL_SPECIALIST")
        .length,
      fullMark: 100,
    },
    {
      subject: "Equip Shop",
      count: users.filter((u) => u.user_type === "AGRICULTURAL_EQUIPMENT_SHOP")
        .length,
      fullMark: 100,
    },
    {
      subject: "Trader",
      count: users.filter((u) => u.user_type === "TRADER_VENDOR").length,
      fullMark: 100,
    },
    {
      subject: "Breeder",
      count: users.filter((u) => u.user_type === "LIVESTOCK_BREEDER").length,
      fullMark: 100,
    },
    {
      subject: "Livestock Spec",
      count: users.filter((u) => u.user_type === "LIVESTOCK_SPECIALIST").length,
      fullMark: 100,
    },
    {
      subject: "Others",
      count: users.filter((u) => u.user_type === "OTHERS").length,
      fullMark: 100,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {/* Category Overview */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 border-0 shadow-lg hover:shadow-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-bl-full"></div>
        <CardHeader className="pb-2 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
                Category Overview
              </CardTitle>
              <p className="text-xs text-blue-600/80 mt-0.5">
                Distribution across categories
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryData}>
              <PolarGrid stroke="#94a3b8" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#475569", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, "auto"]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Categories"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={4}
                fill="#3b82f6"
                fillOpacity={0.5}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Type Overview */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border-0 shadow-lg hover:shadow-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-bl-full"></div>
        <CardHeader className="pb-2 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-violet-800 uppercase tracking-wide">
                User Type Overview
              </CardTitle>
              <p className="text-xs text-violet-600/80 mt-0.5">
                User demographics
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={userTypeData}>
              <PolarGrid stroke="#94a3b8" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#475569", fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, "auto"]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Users"
                dataKey="count"
                stroke="#7c3aed"
                strokeWidth={4}
                fill="#8b5cf6"
                fillOpacity={0.5}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resource Overview */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-0 shadow-lg hover:shadow-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-bl-full"></div>
        <CardHeader className="pb-2 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">
                Resource Overview
              </CardTitle>
              <p className="text-xs text-emerald-600/80 mt-0.5">
                Knowledge base distribution
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={resourceData}>
              <PolarGrid stroke="#94a3b8" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#475569", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, "auto"]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Resources"
                dataKey="count"
                stroke="#059669"
                strokeWidth={4}
                fill="#10b981"
                fillOpacity={0.5}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
