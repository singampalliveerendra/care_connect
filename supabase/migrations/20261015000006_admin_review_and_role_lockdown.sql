-- Admin review of provider listings, and the privilege holes it depends on.
--
-- 1. profiles.role was writable by its owner: profiles_insert_own and
--    profiles_update_own check only `id = auth.uid()`, and table-wide INSERT /
--    UPDATE grants covered every column. Any signed-in provider could make
--    themselves an admin with one PATCH and then read every family's enquiry.
--    Owners keep their own name and phone; the role is set only by the
--    column default ('provider') or by the service role.
--
-- 2. providers INSERT checked only ownership, so a provider could create a
--    listing that was already approved, verified and premium, skipping review
--    entirely (brief §6.2, §11, §24). A trigger now pins those columns for
--    anyone who isn't an admin; the service role (seeds, Studio) is untouched.
--
-- 3. Approving needs `providers.status`, which 20260818000004 deliberately
--    keeps out of the authenticated column grant. Rather than widen that grant
--    for everyone, admins act through one SECURITY DEFINER function that checks
--    is_admin() itself, updates the application record and writes an audit row.

-- ---------------------------------------------------------------- 1. role

revoke insert, update on profiles from authenticated, anon;
grant insert (id, full_name, phone) on profiles to authenticated;
grant update (full_name, phone) on profiles to authenticated;

-- ---------------------------------------------------------------- 2. insert defaults

create or replace function enforce_provider_insert_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') and not is_admin() then
    new.status       := 'pending';
    new.verification := 'unverified';
    new.tier         := 'free';
  end if;
  return new;
end $$;

create trigger providers_insert_defaults
  before insert on providers
  for each row execute function enforce_provider_insert_defaults();

create or replace function enforce_application_insert_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') and not is_admin() then
    new.status      := 'submitted';
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  return new;
end $$;

create trigger provider_applications_insert_defaults
  before insert on provider_applications
  for each row execute function enforce_application_insert_defaults();

-- ---------------------------------------------------------------- 3. review

create or replace function admin_review_provider(
  p_provider_id uuid,
  p_decision    provider_status,
  p_notes       text default null
) returns provider_status
language plpgsql security definer set search_path = public as $$
declare
  previous provider_status;
begin
  if not is_admin() then
    raise exception 'Only an admin can review listings' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected', 'suspended', 'pending') then
    raise exception 'Unsupported decision %', p_decision using errcode = '22023';
  end if;

  if p_notes is not null and length(p_notes) > 1000 then
    raise exception 'Notes are limited to 1000 characters' using errcode = '22001';
  end if;

  select status into previous from providers where id = p_provider_id for update;
  if not found then
    raise exception 'Listing not found' using errcode = 'P0002';
  end if;

  update providers set status = p_decision where id = p_provider_id;

  update provider_applications
     set status = case p_decision
                    when 'approved' then 'approved'::application_status
                    when 'rejected' then 'rejected'::application_status
                    when 'pending'  then 'under_review'::application_status
                    else status
                  end,
         notes       = coalesce(nullif(trim(p_notes), ''), notes),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where provider_id = p_provider_id;

  insert into audit_logs (actor_id, action, entity, entity_id, detail)
  values (
    auth.uid(),
    'provider.review',
    'providers',
    p_provider_id,
    jsonb_build_object('from', previous, 'to', p_decision, 'notes', nullif(trim(p_notes), ''))
  );

  return p_decision;
end $$;

revoke all on function admin_review_provider(uuid, provider_status, text) from public, anon;
grant execute on function admin_review_provider(uuid, provider_status, text) to authenticated;
