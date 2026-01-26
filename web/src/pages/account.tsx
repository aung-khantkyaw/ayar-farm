import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  gender: string;
  userType: string;
  location: string;
  profilePicture: string;
}

const states = [
  { id: "bTuNIfLfchNvk1N_", code: "KACHIN", en: "KACHIN", mm: "ကချင်" },
  { id: "ta4SEQoCI0DVTK2T", code: "KAYAH", en: "KAYAH", mm: "ကယား" },
  { id: "1dzIVEs684iyjetc", code: "KAYIN", en: "KAYIN", mm: "ကရင်" },
  { id: "aVHfHbYrrdNZu9bW", code: "CHIN", en: "CHIN", mm: "ချင်း" },
  { id: "EbUz7oziqo6OB5pL", code: "SAGAING", en: "SAGAING", mm: "စစ်ကိုင်း" },
  {
    id: "X8rt_XwuTgAggCju",
    code: "TANINTHARYI",
    en: "TANINTHARYI",
    mm: "တနသာရီ",
  },
  { id: "zBMPM_jGuwbus35I", code: "BAGO", en: "BAGO", mm: "ပဲခူး" },
  { id: "u431U0SGuX9lkur-", code: "MAGWE", en: "MAGWE", mm: "မကွေး" },
  { id: "5PflwjWItczLTOof", code: "MANDALAY", en: "MANDALAY", mm: "မန္တလေး" },
  { id: "uQgglJ-AhohYQJNB", code: "MON", en: "MON", mm: "မွန်" },
  { id: "OfeDuBL9FsUHKi8j", code: "RAKHINE", en: "RAKHINE", mm: "ရခိုင်" },
  { id: "Zvxm3m8cAwCeDgz1", code: "YANGON", en: "YANGON", mm: "ရန်ကုန်" },
  { id: "DZ1kOrvrt-7LntG4", code: "SHAN", en: "SHAN", mm: "ရှမ်း" },
  { id: "tY793VdREy9r5xsl", code: "AYEYAWADY", en: "AYEYAWADY", mm: "ဧရာ၀တီ" },
  {
    id: "sH0ybsmxNuxmeOT_",
    code: "NAYPYITAW",
    en: "NAYPYITAW",
    mm: "နေပြည်တော်",
  },
];

export default function AccountPage() {
  const { user, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
    phoneNumber: "",
    gender: "",
    userType: "",
    location: "",
    profilePicture: "",
  });
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedTownship, setSelectedTownship] = useState<string>("");
  const [townships, setTownships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        gender: user.gender || "",
        userType: user.userType || "",
        location: user.location || "",
        profilePicture: user.profilePicture || "",
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStateChange = async (stateId: string) => {
    setSelectedState(stateId);
    if (stateId) {
      try {
        // Fetch townships for the selected state
        const stateNumber = states.find((s) => s.id === stateId)?.code;
        if (stateNumber) {
          const response = await fetch(
            `https://myanmaridentityapi.laziestant.tech/v1/states/number/${stateNumber}/townships`,
          );
          if (response.ok) {
            const data = await response.json();
            setTownships(data);
          }
        }
      } catch (error) {
        console.error("Error fetching townships:", error);
      }
    } else {
      setTownships([]);
      setSelectedTownship("");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare the updated profile data
      const updatedData = {
        id: formData.id,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
        userType: formData.userType,
        location: `${states.find(s => s.id === selectedState)?.en || ''} ${townships.find(t => t.id === selectedTownship)?.name.en || ''} ${formData.location}`.trim(),
        ...(profilePictureFile && { profilePicture: profilePictureFile }),
      };

      // Call the update function from auth provider
      await updateUserProfile(updatedData);

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={
                    imagePreview ||
                    formData.profilePicture ||
                    "/placeholder-avatar.jpg"
                  }
                  alt={formData.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                  {formData.name?.charAt(0)?.toUpperCase() ||
                    formData.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="profilePicture" className="cursor-pointer">
                  <span className="text-sm font-medium">
                    Change Profile Picture
                  </span>
                </Label>
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("profilePicture")?.click()
                  }
                >
                  Choose File
                </Button>
              </div>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled
              />
            </div>

            {/* Phone Number Field */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
            </div>

            {/* Gender Selection */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleSelectChange("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="userType">User Type</Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => handleSelectChange("userType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="agriculturalSpecialist">
                    Agricultural Specialist
                  </SelectItem>
                  <SelectItem value="agriculturalEquipmentShop">
                    Agricultural Equipment Shop
                  </SelectItem>
                  <SelectItem value="traderVendor">Trader/Vendor</SelectItem>
                  <SelectItem value="livestockBreeder">
                    Livestock Breeder
                  </SelectItem>
                  <SelectItem value="livestockSpecialist">
                    Livestock Specialist
                  </SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={selectedState} onValueChange={handleStateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="township">Township</Label>
                <Select
                  value={selectedTownship}
                  onValueChange={setSelectedTownship}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select township" />
                  </SelectTrigger>
                  <SelectContent>
                    {townships.map((township) => (
                      <SelectItem key={township.id} value={township.id}>
                        {township.name.en || township.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <Label htmlFor="location">Address</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
