/**
 * Hand-authored to match supabase/migrations/20260818000001_init.sql.
 * Regenerate once the project is live:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type UserRole = "family" | "provider" | "admin";
export type ProviderStatus = "draft" | "pending" | "approved" | "rejected" | "suspended";
export type ApplicationStatus = "submitted" | "under_review" | "approved" | "rejected";
export type VerificationStatus =
  | "unverified" | "business_verified" | "credential_verified"
  | "background_check" | "careconnect_verified";
export type ListingTier = "free" | "standard" | "premium";
export type PricingBand = "budget" | "mid" | "premium";
export type EnquiryStatus = "new" | "delivered" | "viewed" | "responded" | "closed";
export type DeliveryChannel = "email" | "whatsapp" | "in_app";
export type DeliveryStatus = "pending" | "sent" | "failed" | "skipped";
export type UrgencyLevel = "immediate" | "within_week" | "within_month" | "planning";
export type MobilityLevel = "independent" | "needs_assistance" | "wheelchair" | "bedridden";
export type CityWave = "test_bed" | "wave_1" | "wave_2" | "wave_3";

export type City = {
  id: string;
  name: string;
  slug: string;
  state: string;
  wave: CityWave;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Service = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Provider = {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  city_id: string;
  areas_covered: string[];
  languages: string[];
  phone: string;
  whatsapp: string | null;
  email: string;
  website: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  address_is_public: boolean;
  pricing_band: PricingBand | null;
  established_year: number | null;
  staff_size: string | null;
  logo_url: string | null;
  status: ProviderStatus;
  verification: VerificationStatus;
  tier: ListingTier;
  operating_hours: Record<string, unknown> | null;
  emergency_available: boolean;
  created_at: string;
  updated_at: string;
};

export type Enquiry = {
  id: string;
  provider_id: string;
  service_id: string | null;
  city_id: string;
  family_name: string;
  phone: string;
  email: string | null;
  recipient_age: number | null;
  recipient_gender: string | null;
  area: string | null;
  care_requirement: string;
  mobility: MobilityLevel | null;
  hours_required: string | null;
  start_date: string | null;
  duration: string | null;
  preferred_language: string | null;
  preferred_caregiver_sex: string | null;
  budget_band: PricingBand | null;
  urgency: UrgencyLevel | null;
  additional_message: string | null;
  status: EnquiryStatus;
  source: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadDelivery = {
  id: string;
  enquiry_id: string;
  provider_id: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  detail: string | null;
  attempted_at: string;
};

export type ProviderApplication = {
  id: string;
  provider_id: string;
  submitted_by: string | null;
  status: ApplicationStatus;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      cities: Table<City>;
      service_categories: Table<ServiceCategory>;
      services: Table<Service>;
      providers: Table<Provider>;
      provider_services: Table<{ provider_id: string; service_id: string }>;
      provider_applications: Table<ProviderApplication>;
      enquiries: Table<Enquiry>;
      lead_deliveries: Table<LeadDelivery>;
      audit_logs: Table<{
        id: string;
        actor_id: string | null;
        action: string;
        entity: string;
        entity_id: string | null;
        detail: Record<string, unknown> | null;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      provider_status: ProviderStatus;
      application_status: ApplicationStatus;
      verification_status: VerificationStatus;
      listing_tier: ListingTier;
      pricing_band: PricingBand;
      enquiry_status: EnquiryStatus;
      delivery_channel: DeliveryChannel;
      delivery_status: DeliveryStatus;
      urgency_level: UrgencyLevel;
      mobility_level: MobilityLevel;
      city_wave: CityWave;
    };
    CompositeTypes: Record<string, never>;
  };
};
