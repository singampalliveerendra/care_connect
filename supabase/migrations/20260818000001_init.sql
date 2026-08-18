-- CareConnect India — MVP initial schema
-- Brief §16/§26: RLS on all user/provider-owned data, migrations for every schema change,
-- public provider data separated from private operational data.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums

create type user_role            as enum ('family','provider','admin');
create type provider_status      as enum ('draft','pending','approved','rejected','suspended');
create type application_status   as enum ('submitted','under_review','approved','rejected');
create type verification_status  as enum ('unverified','business_verified','credential_verified','background_check','careconnect_verified');
create type listing_tier         as enum ('free','standard','premium');
create type pricing_band         as enum ('budget','mid','premium');
create type enquiry_status       as enum ('new','delivered','viewed','responded','closed');
create type delivery_channel     as enum ('email','whatsapp','in_app');
create type delivery_status      as enum ('pending','sent','failed','skipped');
create type urgency_level        as enum ('immediate','within_week','within_month','planning');
create type mobility_level       as enum ('independent','needs_assistance','wheelchair','bedridden');
create type city_wave            as enum ('test_bed','wave_1','wave_2','wave_3');

-- ---------------------------------------------------------------- helpers

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- profiles
-- Application identity + role, keyed to Supabase auth.users (brief §17 `users`).

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role   not null default 'provider',
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------- cities

create table cities (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  state       text        not null,
  wave        city_wave   not null default 'wave_2',
  is_active   boolean     not null default false,
  latitude    numeric(9,6),
  longitude   numeric(9,6),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index cities_active_idx on cities (is_active) where is_active;
create trigger cities_updated_at before update on cities
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------- taxonomy

create table service_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  description text,
  sort_order  int         not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

create table services (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid        not null references service_categories(id) on delete restrict,
  name        text        not null,
  slug        text        not null unique,
  description text,
  sort_order  int         not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);
create index services_category_idx on services (category_id);

-- ---------------------------------------------------------------- providers

create table providers (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid references auth.users(id) on delete set null,
  name                text        not null,
  slug                text        not null unique,
  description         text,
  city_id             uuid        not null references cities(id) on delete restrict,
  areas_covered       text[]      not null default '{}',
  languages           text[]      not null default '{}',
  phone               text        not null,
  email               text        not null,
  website             text,
  address             text,
  address_is_public   boolean     not null default false,
  pricing_band        pricing_band,
  established_year    int,
  staff_size          text,
  logo_url            text,
  status              provider_status     not null default 'draft',
  verification        verification_status not null default 'unverified',
  tier                listing_tier        not null default 'free',
  -- future-ready fields (brief §10), unused in MVP UI
  operating_hours     jsonb,
  emergency_available boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint providers_established_year_sane
    check (established_year is null or established_year between 1900 and extract(year from now())::int)
);
create index providers_city_status_idx on providers (city_id, status);
create index providers_owner_idx       on providers (owner_id);
create index providers_tier_idx        on providers (tier);
create trigger providers_updated_at before update on providers
  for each row execute function set_updated_at();

create table provider_services (
  provider_id uuid not null references providers(id) on delete cascade,
  service_id  uuid not null references services(id)  on delete cascade,
  primary key (provider_id, service_id)
);
create index provider_services_service_idx on provider_services (service_id);

-- ---------------------------------------------------------------- applications

create table provider_applications (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid not null references providers(id) on delete cascade,
  submitted_by  uuid references auth.users(id) on delete set null,
  status        application_status not null default 'submitted',
  notes         text,
  reviewed_by   uuid references auth.users(id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index provider_applications_provider_idx on provider_applications (provider_id);
create trigger provider_applications_updated_at before update on provider_applications
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------- enquiries
-- Brief §9: structured care request. Contact details are private operational data
-- and must never be readable through a public API (§16).

create table enquiries (
  id                       uuid primary key default gen_random_uuid(),
  provider_id              uuid not null references providers(id) on delete cascade,
  service_id               uuid references services(id) on delete set null,
  city_id                  uuid not null references cities(id) on delete restrict,

  family_name              text not null,
  phone                    text not null,
  email                    text,

  recipient_age            int,
  recipient_gender         text,
  area                     text,
  care_requirement         text not null,
  mobility                 mobility_level,
  hours_required           text,
  start_date               date,
  duration                 text,
  preferred_language       text,
  preferred_caregiver_sex  text,
  budget_band              pricing_band,
  urgency                  urgency_level,
  additional_message       text,

  status                   enquiry_status not null default 'new',
  source                   text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint enquiries_age_sane check (recipient_age is null or recipient_age between 0 and 120)
);
create index enquiries_provider_idx on enquiries (provider_id, created_at desc);
create trigger enquiries_updated_at before update on enquiries
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------- lead delivery

create table lead_deliveries (
  id           uuid primary key default gen_random_uuid(),
  enquiry_id   uuid not null references enquiries(id) on delete cascade,
  provider_id  uuid not null references providers(id) on delete cascade,
  channel      delivery_channel not null,
  status       delivery_status  not null default 'pending',
  detail       text,
  attempted_at timestamptz not null default now()
);
create index lead_deliveries_enquiry_idx  on lead_deliveries (enquiry_id);
create index lead_deliveries_provider_idx on lead_deliveries (provider_id);

-- ---------------------------------------------------------------- audit

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_entity_idx on audit_logs (entity, entity_id);

-- ================================================================ RLS

alter table profiles              enable row level security;
alter table cities                enable row level security;
alter table service_categories    enable row level security;
alter table services              enable row level security;
alter table providers             enable row level security;
alter table provider_services     enable row level security;
alter table provider_applications enable row level security;
alter table enquiries             enable row level security;
alter table lead_deliveries       enable row level security;
alter table audit_logs            enable row level security;

-- profiles: own row, admins everything
create policy profiles_select_own on profiles for select
  using (id = auth.uid() or is_admin());
create policy profiles_insert_own on profiles for insert
  with check (id = auth.uid());
create policy profiles_update_own on profiles for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- lookup data: active rows are public
create policy cities_public_read on cities for select
  using (is_active or is_admin());
create policy service_categories_public_read on service_categories for select
  using (is_active or is_admin());
create policy services_public_read on services for select
  using (is_active or is_admin());

-- providers: only approved + active-city rows are public (brief acceptance criteria)
create policy providers_public_read on providers for select
  using (
    (status = 'approved' and exists (select 1 from cities c where c.id = city_id and c.is_active))
    or owner_id = auth.uid()
    or is_admin()
  );
create policy providers_insert_own on providers for insert
  with check (owner_id = auth.uid());
create policy providers_update_own on providers for update
  using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid() or is_admin());

create policy provider_services_read on provider_services for select
  using (
    exists (
      select 1 from providers p
      where p.id = provider_id
        and (
          (p.status = 'approved' and exists (select 1 from cities c where c.id = p.city_id and c.is_active))
          or p.owner_id = auth.uid()
          or is_admin()
        )
    )
  );
create policy provider_services_write on provider_services for all
  using (exists (select 1 from providers p where p.id = provider_id and (p.owner_id = auth.uid() or is_admin())))
  with check (exists (select 1 from providers p where p.id = provider_id and (p.owner_id = auth.uid() or is_admin())));

-- applications: owner + admin only
create policy provider_applications_read on provider_applications for select
  using (submitted_by = auth.uid() or is_admin()
         or exists (select 1 from providers p where p.id = provider_id and p.owner_id = auth.uid()));
create policy provider_applications_insert on provider_applications for insert
  with check (submitted_by = auth.uid());
create policy provider_applications_update on provider_applications for update
  using (is_admin()) with check (is_admin());

-- enquiries: anyone may submit; only the owning provider and admins may read.
-- Family contact details are therefore never reachable from a public API.
create policy enquiries_public_insert on enquiries for insert
  with check (
    exists (
      select 1 from providers p
      where p.id = provider_id
        and p.status = 'approved'
        and exists (select 1 from cities c where c.id = p.city_id and c.is_active)
    )
  );
create policy enquiries_provider_read on enquiries for select
  using (exists (select 1 from providers p where p.id = provider_id and p.owner_id = auth.uid()) or is_admin());
create policy enquiries_provider_update on enquiries for update
  using (exists (select 1 from providers p where p.id = provider_id and p.owner_id = auth.uid()) or is_admin())
  with check (exists (select 1 from providers p where p.id = provider_id and p.owner_id = auth.uid()) or is_admin());

create policy lead_deliveries_read on lead_deliveries for select
  using (exists (select 1 from providers p where p.id = provider_id and p.owner_id = auth.uid()) or is_admin());

create policy audit_logs_admin_read on audit_logs for select using (is_admin());
