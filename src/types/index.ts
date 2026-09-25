export type RoleType =
  | 'personal'
  | 'professional'
  | 'business'
  | 'service_provider'
  | 'freelancer'
  | 'employer'
  | 'seller'
  | 'property_owner';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  bio?: string;
  photoURL?: string;
  coverURL?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  phone?: string;
  website?: string;
  profession?: string;
  skills?: string[];
  servicesOffered?: string[];
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    whatsapp?: string;
    github?: string;
  };
  roles: RoleType[];
  verifications: {
    phoneVerified?: boolean;
    emailVerified?: boolean;
    businessVerified?: boolean;
    identityVerified?: boolean;
    professionalVerified?: boolean;
  };
  privacy: {
    showPhone: boolean;
    showEmail: boolean;
    showLocation: boolean;
    allowMessages: boolean;
    allowFollowers: boolean;
  };
  followersCount: number;
  followingCount: number;
  isAdmin?: boolean;
  preferredLanguage: 'en' | 'bn';
  createdAt: string;
  updatedAt: string;
}

export type ListingType =
  | 'property'
  | 'product'
  | 'service'
  | 'business'
  | 'job'
  | 'project';

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  currency: string;
  priceUnit?: string; // '/month', '/hr', 'total', etc.
  location: string;
  coordinates?: { lat: number; lng: number };
  images: string[];
  userId: string;
  userFullName: string;
  userUsername: string;
  userPhoto?: string;
  userVerified?: boolean;
  userPhone?: string;
  userEmail?: string;
  status: 'active' | 'sold' | 'rented' | 'closed';
  viewsCount: number;
  savesCount: number;
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;

  // Specific subtype properties
  propertyDetails?: {
    transactionType: 'for_rent' | 'for_sale' | 'for_lease';
    propertyType:
      | 'apartment'
      | 'house'
      | 'room'
      | 'mess'
      | 'hostel'
      | 'shop'
      | 'office'
      | 'warehouse'
      | 'land';
    bedrooms?: number;
    bathrooms?: number;
    areaSqFt?: number;
    floor?: string;
    furnishedStatus?: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
    amenities?: string[];
  };

  productDetails?: {
    condition: 'new' | 'like_new' | 'used_good' | 'used_fair';
    brand?: string;
    model?: string;
  };

  serviceDetails?: {
    serviceArea?: string;
    experienceYears?: number;
    availableToday?: boolean;
    openHours?: string;
  };

  businessDetails?: {
    businessName: string;
    openingHours?: string;
    address?: string;
    website?: string;
    isOpenNow?: boolean;
  };

  jobDetails?: {
    companyName: string;
    jobType: 'full_time' | 'part_time' | 'remote' | 'contract' | 'internship';
    salaryRange?: string;
    requirements?: string[];
    deadline?: string;
  };

  projectDetails?: {
    projectBudget: number;
    deadline?: string;
    skillsRequired?: string[];
    proposalsCount?: number;
  };
}

export interface Post {
  id: string;
  userId: string;
  userFullName: string;
  userUsername: string;
  userPhoto?: string;
  content: string;
  imageUrl?: string;
  category?: string;
  communityId?: string;
  communityName?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userFullName: string;
  userUsername: string;
  userPhoto?: string;
  text: string;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  coverImage?: string;
  creatorId: string;
  membersCount: number;
  createdAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  imageUrl?: string;
  organizerId: string;
  organizerName: string;
  attendeesCount: number;
  createdAt: string;
}

export interface RequestItem {
  id: string;
  userId: string;
  userFullName: string;
  userUsername: string;
  userPhoto?: string;
  title: string;
  description: string;
  category: string;
  budget?: number;
  location: string;
  status: 'open' | 'responses_received' | 'closed';
  responsesCount: number;
  createdAt: string;
}

export interface RequestResponse {
  id: string;
  requestId: string;
  providerId: string;
  providerName: string;
  providerUsername: string;
  providerPhoto?: string;
  providerPhone?: string;
  message: string;
  offerPrice?: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantDetails: Record<
    string,
    { fullName: string; username: string; photoURL?: string }
  >;
  lastMessage: string;
  lastMessageTimestamp: string;
  lastSenderId: string;
  unreadCount: Record<string, number>;
  listingId?: string;
  listingTitle?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  read: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | 'follow'
    | 'like'
    | 'comment'
    | 'message'
    | 'booking'
    | 'job_application'
    | 'request_quote'
    | 'verification';
  actorId: string;
  actorName: string;
  actorPhoto?: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  providerName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingDate: string;
  bookingTime: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Review {
  id: string;
  targetId: string;
  targetType: 'listing' | 'user' | 'business';
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhoto?: string;
  rating: number;
  comment: string;
  verifiedPurchase?: boolean;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  coverLetter: string;
  resumeUrl?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  createdAt: string;
}

export interface FreelanceProposal {
  id: string;
  projectId: string;
  projectTitle: string;
  clientId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerUsername: string;
  bidAmount: number;
  estimatedDays: number;
  coverLetter: string;
  status: 'submitted' | 'accepted' | 'declined';
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'phone' | 'email' | 'business' | 'identity' | 'professional';
  documentUrl?: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'listing' | 'user' | 'post' | 'comment';
  reason:
    | 'fake_listing'
    | 'scam'
    | 'wrong_price'
    | 'already_sold'
    | 'harassment'
    | 'spam'
    | 'other';
  details: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
}
