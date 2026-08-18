-- An enquiry submitted by an anonymous family still has to record its delivery
-- attempts. Rather than shipping a service-role key into the app (brief §16),
-- allow an insert only when it refers to an enquiry that already exists and the
-- provider_id genuinely matches that enquiry. The rows stay write-only for
-- anon: lead_deliveries_read still restricts SELECT to the owning provider.
create policy lead_deliveries_insert_for_enquiry on lead_deliveries for insert
  with check (
    exists (
      select 1 from enquiries e
      where e.id = enquiry_id
        and e.provider_id = lead_deliveries.provider_id
    )
  );
