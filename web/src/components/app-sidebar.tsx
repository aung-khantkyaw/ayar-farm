import * as React from "react";
import {
  IconVideo,
  IconWheat,
  // IconFileAi,
  // IconFileDescription,
  IconBulldozer,
  IconHelp,
  IconLeaf,
  IconMeat,
  IconSearch,
  IconSettings,
  IconFishHook,
  IconUsers,
  IconDeviceMobile,
  IconMessageCog,
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
  // navClouds: [
  //   {
  //     title: "Capture",
  //     icon: IconVideo,
  //     isActive: true,
  //     url: "#",
  //     items: [
  //       {
  //         title: "Active Proposals",
  //         url: "#",
  //       },
  //       {
  //         title: "Archived",
  //         url: "#",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Proposal",
  //     icon: IconFileDescription,
  //     url: "#",
  //     items: [
  //       {
  //         title: "Active Proposals",
  //         url: "#",
  //       },
  //       {
  //         title: "Archived",
  //         url: "#",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Prompts",
  //     icon: IconFileAi,
  //     url: "#",
  //     items: [
  //       {
  //         title: "Active Proposals",
  //         url: "#",
  //       },
  //       {
  //         title: "Archived",
  //         url: "#",
  //       },
  //     ],
  //   },
  // ],
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
      name: "Users Management",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      name: "Chat Rooms Management",
      url: "/admin/chat-room",
      icon: IconMessageCog,
    },
    {
      name: "Videos Management",
      url: "/admin/videos",
      icon: IconVideo,
    },
    {
      name: "Applications",
      url: "/admin/applications",
      icon: IconDeviceMobile,
    },
  ],
  category: [
    {
      name: "Crops",
      url: "/category/crops",
      icon: IconWheat,
    },
    {
      name: "Livestock",
      url: "/category/livestock",
      icon: IconMeat,
    },
    {
      name: "Fisheries",
      url: "/category/fisheries",
      icon: IconFishHook,
    },
    {
      name: "Machine",
      url: "/category/machine",
      icon: IconBulldozer,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const authUser = {
    name: user.name || "Unknown User",
    email: user.email || "No Email",
    avatar: user.profile_picture || "https://via.placeholder.com/200",
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
        <NavMain items={data.main} />
        <NavCategories items={data.category} />
        {/*<NavSecondary items={data.navSecondary} className="mt-auto" />*/}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={authUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
