import * as React from "react";
import {
  IconVideoMinus,
  IconWheat,
  IconTractor,
  IconHelp,
  IconLeaf,
  IconBuildingCottage,
  IconSearch,
  IconSettings,
  IconFishHook,
  IconUsers,
  IconDeviceMobile,
  IconMessageCog,
  IconNews,
  IconBuildingBank,
  IconSpeakerphone,
  IconFileSettings,
  IconKey,
  IconLibrary,
  IconVector,
  IconThinkingMedium,
} from "@tabler/icons-react";

import { NavCategories } from "@/components/nav-category";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/providers/auth-provider.tsx";

const data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  main: [
    {
      name: "Users",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      name: "Chat Rooms",
      url: "/admin/chat-room",
      icon: IconMessageCog,
    },
    {
      name: "Announcements",
      url: "/admin/announcements",
      icon: IconSpeakerphone,
    },
    {
      name: "Documents",
      url: "/admin/system-documents",
      icon: IconFileSettings,
    },
  ],
  resources: [
    {
      name: "Loans",
      url: "/resource/loans",
      icon: IconBuildingBank,
    },
    {
      name: "Agromet Bulletins",
      url: "/resource/agromet-bulletins",
      icon: IconNews,
    },
    {
      name: "Videos",
      url: "/resource/videos",
      icon: IconVideoMinus,
    },
    {
      name: "Applications",
      url: "/resource/applications",
      icon: IconDeviceMobile,
    },
  ],
  categories: [
    {
      name: "Crops",
      url: "/category/crops",
      icon: IconWheat,
    },
    {
      name: "Livestock",
      url: "/category/livestock",
      icon: IconBuildingCottage,
    },
    {
      name: "Fisheries",
      url: "/category/fisheries",
      icon: IconFishHook,
    },
    {
      name: "Machines",
      url: "/category/machines",
      icon: IconTractor,
    },
  ],
  ai: [
    {
      name: "API Keys",
      url: "/ai/api-keys",
      icon: IconKey,
    },
    {
      name: "Knowledge Base",
      url: "/ai/knowledge-base",
      icon: IconLibrary,
    },
    {
      name: "Data Vectorization",
      url: "/ai/data-vectorization",
      icon: IconVector,
    },
    {
      name: "AI Playground",
      url: "/ai/ai-playground",
      icon: IconThinkingMedium,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const authUser = {
    name: user?.name || "Unknown User",
    email: user?.email || "No Email",
    avatar: user?.profile_picture || "",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <IconLeaf className="!size-5" />
                <span className="text-base font-semibold">
                  AyarFarmLink MSME
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[]} />
        <NavCategories title="System Managements" items={data.main} />
        <NavCategories title="Resource Managements" items={data.resources} />
        <NavCategories title="Category Managements" items={data.categories} />
        <NavCategories title="AI Configurations" items={data.ai} />
        {/*<NavSecondary items={data.navSecondary} className="mt-auto" />*/}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={authUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
