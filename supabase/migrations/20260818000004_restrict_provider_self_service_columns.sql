-- RLS decides WHICH ROWS a provider may update; it does not decide which COLUMNS.
-- Without this, an owner could PATCH their own verification, tier or status and
-- promote themselves to "CareConnect Verified" -- exactly what brief 11 and 24
-- forbid ("a provider's commercial subscription must never automatically
-- determine whether it is medically or operationally trusted").
--
-- Column-level privileges enforce that in the engine. Admin actions run through
-- Supabase Studio on the service role (brief 6.3), which is unaffected.

revoke update on providers from authenticated, anon;

grant update (
  name, description, city_id, areas_covered, languages,
  phone, email, website, address, address_is_public,
  pricing_band, established_year, staff_size, logo_url,
  operating_hours, emergency_available
) on providers to authenticated;

-- Providers may move a lead through its workflow, but must not rewrite what the
-- family actually said or who it was for.
revoke update on enquiries from authenticated, anon;
grant update (status) on enquiries to authenticated;
