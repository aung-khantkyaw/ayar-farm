import { AppSidebar } from "@/components/app-sidebar";
import { API_URL } from "@/lib/config";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/providers/auth-provider.tsx";
import LoadingSpinner from "@/components/LoadingSpinner.tsx";
import { AdminProvider, useAdmin } from "@/providers/admin-provider";
import { useSocket } from "@/providers/socket-provider";
import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  RefreshCw,
  Users as UsersIcon,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  ShieldUser,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }
};

const UsersManagement = () => {
  const {
    users,
    isLoading,
    error,
    refreshUsers,
    getTotalUsers,
    getVerifiedUsers,
    getUnverifiedUsers,
    getUsersByType,
  } = useAdmin();
  const { onlineUsers } = useSocket();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterVerified, setFilterVerified] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Create user form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    name: "",
    email: "",
    username: "",
    userType: "FARMER",
    password: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone_number?.includes(searchTerm);

      const userRole = user.user_type;
      const matchesRole = filterRole === "all" || userRole === filterRole;

      const isVerified = user.isVerified;
      const matchesVerified =
        filterVerified === "all" ||
        (filterVerified === "verified" && isVerified) ||
        (filterVerified === "unverified" && !isVerified);

      return matchesSearch && matchesRole && matchesVerified;
    });
  }, [users, searchTerm, filterRole, filterVerified]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterVerified]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterRole("all");
    setFilterVerified("all");
    setCurrentPage(1);
  };

  const handleCreateUser = async () => {
    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append("name", createUserForm.name);
      formData.append("email", createUserForm.email);
      formData.append("username", createUserForm.username);
      formData.append("userType", createUserForm.userType);
      formData.append("password", createUserForm.password);

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const response = await fetch(`${API_URL}/admin/create-user`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("User created successfully!");
        setIsCreateDialogOpen(false);
        setCreateUserForm({
          name: "",
          email: "",
          username: "",
          userType: "FARMER",
          password: "",
        });
        setSelectedFile(null);
        refreshUsers(); // Refresh the user list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message);
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Create user error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setCreateUserForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getProfilePictureUrl = (profilePicture: string) => {
    if (profilePicture.startsWith("http")) {
      return profilePicture;
    }
    return `${API_URL}${profilePicture}`;
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "ADMIN":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "FARMER":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "AGRICULTURAL_SPECIALIST":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case "AGRICULTURAL_EQUIPMENT_SHOP":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "TRADER_VENDOR":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "LIVESTOCK_BREEDER":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "LIVESTOCK_SPECIALIST":
        return "bg-lime-100 text-lime-800 hover:bg-lime-200";
      case "OTHERS":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Failed to load users
          </h3>
          <p className="text-gray-600 mt-1">{error}</p>
        </div>
        <Button onClick={refreshUsers} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // if (isLoading) {
  //   return <LoadingSpinner />;
  // }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Users
            </CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg shadow-md">
              <UsersIcon className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {getTotalUsers()}
            </div>
            <p className="text-xs text-gray-600 font-medium">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-50 to-emerald-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Verified Users
            </CardTitle>
            <div className="p-2 bg-green-500 rounded-lg shadow-md">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {getVerifiedUsers().length}
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Email verified accounts
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-orange-50 to-amber-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Unverified Users
            </CardTitle>
            <div className="p-2 bg-orange-500 rounded-lg shadow-md">
              <XCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {getUnverifiedUsers().length}
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Pending verification
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-red-50 to-rose-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-400/20 to-rose-500/20 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Admin Users
            </CardTitle>
            <div className="p-2 bg-red-500 rounded-lg shadow-md">
              <ShieldUser className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-1">
              {getUsersByType("ADMIN").length}
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Administrative accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800">
                User Management
              </CardTitle>
              <CardDescription className="text-gray-600">
                Manage and view all registered users in the system
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system. Fill in all required fields.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter full name"
                        value={createUserForm.name}
                        onChange={(e) =>
                          handleFormChange("name", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={createUserForm.email}
                        onChange={(e) =>
                          handleFormChange("email", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="Enter username"
                        value={createUserForm.username}
                        onChange={(e) =>
                          handleFormChange("username", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="userType">User Type</Label>
                      <Select
                        value={createUserForm.userType}
                        onValueChange={(value) =>
                          handleFormChange("userType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select user type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="FARMER">Farmer</SelectItem>
                          <SelectItem value="AGRICULTURAL_SPECIALIST">
                            Agricultural Specialist
                          </SelectItem>
                          <SelectItem value="AGRICULTURAL_EQUIPMENT_SHOP">
                            Agricultural Equipment Shop
                          </SelectItem>
                          <SelectItem value="TRADER_VENDOR">
                            Trader/Vendor
                          </SelectItem>
                          <SelectItem value="LIVESTOCK_BREEDER">
                            Livestock Breeder
                          </SelectItem>
                          <SelectItem value="LIVESTOCK_SPECIALIST">
                            Livestock Specialist
                          </SelectItem>
                          <SelectItem value="OTHERS">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="profilePicture">Profile Picture</Label>
                      <Input
                        id="profilePicture"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSelectedFile(file);
                        }}
                      />
                      {selectedFile && (
                        <p className="text-sm text-gray-600">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={createUserForm.password}
                        onChange={(e) =>
                          handleFormChange("password", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateUser}
                      disabled={
                        isCreating ||
                        !createUserForm.name ||
                        !createUserForm.email ||
                        !createUserForm.username ||
                        !createUserForm.password
                      }
                    >
                      {isCreating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create User"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                onClick={refreshUsers}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="shadow-sm"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="space-y-4 mt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Search Input */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 shadow-sm"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-wrap">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="role-filter"
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    Role:
                  </Label>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger
                      className="w-[120px] shadow-sm"
                      id="role-filter"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="FARMER">Farmer</SelectItem>
                      <SelectItem value="AGRICULTURAL_SPECIALIST">
                        Agricultural Specialist
                      </SelectItem>
                      <SelectItem value="AGRICULTURAL_EQUIPMENT_SHOP">
                        Agricultural Equipment Shop
                      </SelectItem>
                      <SelectItem value="TRADER_VENDOR">
                        Trader/Vendor
                      </SelectItem>
                      <SelectItem value="LIVESTOCK_BREEDER">
                        Livestock Breeder
                      </SelectItem>
                      <SelectItem value="LIVESTOCK_SPECIALIST">
                        Livestock Specialist
                      </SelectItem>
                      <SelectItem value="OTHERS">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="verified-filter"
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    Status:
                  </Label>
                  <Select
                    value={filterVerified}
                    onValueChange={setFilterVerified}
                  >
                    <SelectTrigger
                      className="w-[140px] shadow-sm"
                      id="verified-filter"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                {(searchTerm ||
                  filterRole !== "all" ||
                  filterVerified !== "all") && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 shadow-sm"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {/* Desktop/Tablet View */}
            <div className="hidden md:block">
              {paginatedUsers.map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center space-x-4 p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b last:border-b-0 ${
                    index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                  }`}
                >
                  <Avatar className="h-14 w-14 ring-2 ring-gray-200 shadow-sm">
                    <AvatarImage
                      src={getProfilePictureUrl(user.profile_picture || "")}
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                      {user.name?.charAt(0)?.toUpperCase() ||
                        user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3 flex-wrap">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {user.name}
                      </h4>
                      <Badge
                        variant="secondary"
                        className={`${getUserTypeColor(
                          user.user_type || "FARMER"
                        )} font-medium shadow-sm`}
                      >
                        {user.user_type || "FARMER"}
                      </Badge>
                      {user.isVerified && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 shadow-sm"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">
                          {user.phone_number}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {formatDate(user.created_at)}</span>
                      </div>
                      {user.last_login && (
                        <div>
                          <span>
                            Last sign in {formatDate(user.last_login)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`text-xs px-2 py-1 rounded font-mono ${
                      onlineUsers.includes(user.id)
                        ? "text-green-600 bg-green-100 font-bold"
                        : "text-gray-400 bg-gray-100"
                    }`}
                  >
                    ID: {user.id.slice(0, 8)}...
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4 p-4">
              {paginatedUsers.map((user) => (
                <Card
                  key={user.id}
                  className="border shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-12 w-12 ring-2 ring-gray-200">
                        <AvatarImage
                          src={getProfilePictureUrl(user.profile_picture || "")}
                          alt={user.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                          {user.name?.charAt(0)?.toUpperCase() ||
                            user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-col space-y-1">
                          <h4 className="font-semibold text-gray-800 truncate">
                            {user.name}
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant="secondary"
                              className={`${getUserTypeColor(
                                user.user_type || "FARMER"
                              )} text-xs`}
                            >
                              {user.user_type || "FARMER"}
                            </Badge>
                            {user.isVerified && (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800 text-xs"
                              >
                                <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="text-gray-500">
                            {user.phone_number}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>Joined {formatDate(user.created_at)}</span>
                          </div>
                        </div>

                        <div
                          className={`text-xs px-2 py-1 rounded font-mono ${
                            onlineUsers.includes(user.id)
                              ? "text-green-600 bg-green-100 font-bold"
                              : "text-gray-400 bg-gray-50"
                          }`}
                        >
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Results Summary and Pagination Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 border-t bg-gray-50/50 gap-4">
              {/* Results Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, filteredUsers.length)} of{" "}
                  {filteredUsers.length} users
                  {filteredUsers.length !== (users?.length || 0) && (
                    <span className="text-gray-400">
                      {" "}
                      (filtered from {users?.length || 0} total)
                    </span>
                  )}
                </span>
                {(searchTerm ||
                  filterRole !== "all" ||
                  filterVerified !== "all") && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filters active</span>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="page-size"
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    Users per page:
                  </Label>
                  <Select
                    value={usersPerPage.toString()}
                    onValueChange={(value) => {
                      setUsersPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger
                      className="w-[80px] shadow-sm"
                      id="page-size"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="shadow-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(totalPages, 5) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 p-0 shadow-sm"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="shadow-sm"
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {filteredUsers.length === 0 &&
              !isLoading &&
              users &&
              users.length > 0 && (
                <div className="text-center py-12 px-4">
                  <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No users found
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    No users match your current search and filter criteria. Try
                    adjusting your filters or search terms.
                  </p>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="shadow-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear all filters
                  </Button>
                </div>
              )}

            {users && users.length === 0 && !isLoading && (
              <div className="text-center py-12 px-4">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No users found
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  There are no users in the system yet. Create your first user
                  to get started.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminUsersPage = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.user_type !== "ADMIN") {
    return <Navigate to="/auth/unauthorized" />;
  }

  return (
    <AdminProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col">
              <UsersManagement />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminProvider>
  );
};

export default AdminUsersPage;
