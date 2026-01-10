import { createFileRoute } from "@tanstack/react-router";
import ChatRoomManagement from "@/app/admin/chat-room";

export const Route = createFileRoute("/admin/chat-room")({
  component: RouteComponent,
});

function RouteComponent() {
  // const { user, isLoading } = useAuth();

  // if (isLoading) {
  //   return <LoadingSpinner />;
  // }

  // if (!user) {
  //   return <Navigate to="/login" />;
  // }

  // if (user.user_metadata?.userType !== "ADMIN") {
  //   return <Navigate to="/auth/unauthorized" />;
  // }

  return <ChatRoomManagement />;
}
