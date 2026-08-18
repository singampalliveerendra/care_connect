-- The previous policy's EXISTS read `enquiries` as the calling role. Anonymous
-- families cannot SELECT enquiries at all (by design), so the check was always
-- false and no delivery attempt was ever recorded.
--
-- A SECURITY DEFINER helper answers the one narrow question the policy needs --
-- "does this enquiry exist and belong to this provider?" -- without granting the
-- caller any read access to enquiry contents.
create or replace function enquiry_belongs_to_provider(p_enquiry uuid, p_provider uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from enquiries e
    where e.id = p_enquiry and e.provider_id = p_provider
  );
$$;

revoke all on function enquiry_belongs_to_provider(uuid, uuid) from public;
grant execute on function enquiry_belongs_to_provider(uuid, uuid) to anon, authenticated;

drop policy if exists lead_deliveries_insert_for_enquiry on lead_deliveries;

create policy lead_deliveries_insert_for_enquiry on lead_deliveries for insert
  with check (enquiry_belongs_to_provider(enquiry_id, provider_id));
