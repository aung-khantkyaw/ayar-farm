export interface CropType {
  id: string;
  name: string;
  description?: string;
  image_urls?: string[];
  category?: string;
  created_at: string;
  updated_at: string;
  crops?: Crop[];
  image_url?: string;
  _count?: {
    crops: number;
  };
}

export interface Crop {
  id: string;
  name: string;
  description?: string;
  image_urls?: string[];
  crop_type_id?: string;
  created_at: string;
  updated_at: string;
  type?: CropType;
  image_url?: string;
  type_id?: string;
}

export interface Fishery {
  id: string;
  name: string;
  image_urls: string;
  created_at: string;
  updated_at: string;
}

export interface Livestock {
  id: string;
  name: string;
  image_urls: string;
  created_at: string;
  updated_at: string;
}

export interface MachineType {
  id: string;
  name: string;
  image_urls: string;
  created_at: string;
  updated_at: string;
  machines: Machine[];
  _count: {
    machines: number;
  };
}

export interface Machine {
  id: string;
  name: string;
  image_urls: string;
  type_id: string;
  created_at: string;
  updated_at: string;
  type?: MachineType;
}

export interface Document {
  id: string;
  title: string;
  author: string;
  file_urls: string[];
  created_at: string;
  updated_at: string;
  size?: number;

  crop_type_id?: string;
  livestock_type_id?: string;
  machine_type_id?: string;
  crop_id?: string;
  livestock_id?: string;
  machine_id?: string;
  fish_id?: string;
  article?: boolean;
  agromet_bulletin?: boolean;

  CropTypes?: CropType;
  Crops?: Crop;
  Fisheries?: Fishery;
  Livestocks?: Livestock;
  MachineTypes?: MachineType;
  Machines?: Machine;
}

export interface User {
  id: string;
  name: string;
  phone_number: string;
  email: string | null;
  gender: string;
  user_type: string;
  profile_picture: string | null;
  location: string | null;
  isVerified: boolean;
  last_login: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  title: string;
  description: string;
  author: string;
  resource_url: string[];
  filename: string;
  size: number;
  version: string;
  platform: string;
  is_active: boolean;
  download_count: number;
  uploaded_at: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  type: "CROPS" | "LIVESTOCK" | "FISHERIES" | "MACHINE";
  description?: string;
  imageUrl?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  isMember?: boolean;
  joinedAt?: string;
  owner: {
    id: string;
    name: string;
    username: string;
    profilePicture: string;
    user_type: string;
  };
  moderators?: {
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      username: string;
      profilePicture: string;
    };
  }[];
  _count: {
    members: number;
    messages: number;
    moderators?: number;
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  groupId?: string;
  groupName?: string;
  user: {
    id: string;
    name: string;
    username: string;
    profilePicture: string;
  };
}

export interface CreateGroupForm {
  name: string;
  type: "CROPS" | "LIVESTOCK" | "FISHERIES" | "MACHINE";
  description: string;
  imageFile: File | null;
}

export interface VideoData {
  id: string;
  type: "VIDEO";
  title: string;
  description: string;
  author: string;
  resource_url: string[];
  filename: string;
  size: number;
  uploaded_at: string;
  is_active: boolean;
}

export interface ActiveVideo {
  id: string;
  title: string;
  description: string;
  resource_url: string;
  filename: string;
  size: number;
  uploaded_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
