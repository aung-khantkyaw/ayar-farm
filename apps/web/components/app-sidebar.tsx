"use client";

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
  IconFileDatabase,
  IconFileTextAi 
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
import { useAuth } from "@/providers/auth-provider";

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
  ai_integration: [
    {
      name: "API Keys",
      url: "/ai_integration/api_keys",
      icon: IconKey,
    },
    {
      name: "Add New Dataset",
      url: "/ai_integration/add_new_dataset",
      icon: IconFileDatabase,
    },
    {
      name: "RAG Testing",
      url: "/ai_integration/rag_testing",
      icon: IconFileTextAi ,
    }
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
              render={<a href="/dashboard" />}
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <span className="text-base font-semibold">
                AyarFarmLink MSME
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[]} />
        <NavCategories title="System Managements" items={data.main} />
        <NavCategories title="Resource Managements" items={data.resources} />
        <NavCategories title="Category Managements" items={data.categories} />
        <NavCategories title="AI Integration" items={data.ai_integration} />
        {/*<NavSecondary items={data.navSecondary} className="mt-auto" />*/}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={authUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
