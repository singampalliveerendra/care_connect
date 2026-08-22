-- Directory listings now lead with "call" and "WhatsApp" as the primary actions,
-- so a listing needs a WhatsApp number of its own: for many small providers the
-- number families should message is not the landline they answer calls on.
--
-- Coordinates are optional. Address alone is unreliable in Indian cities (an
-- old age home is often "near the water tank, second lane"), so a provider that
-- can drop a pin gets a working "Directions" link; one that can't loses nothing.

alter table providers
  add column whatsapp  text,
  add column latitude  numeric(9,6),
  add column longitude numeric(9,6);

alter table providers
  add constraint providers_latitude_range
    check (latitude is null or latitude between -90 and 90),
  add constraint providers_longitude_range
    check (longitude is null or longitude between -180 and 180),
  -- A pin is only meaningful with both halves; one without the other is a bug,
  -- not a partial answer.
  add constraint providers_coordinates_paired
    check ((latitude is null) = (longitude is null));

-- 20260818000004 revoked blanket UPDATE and granted an explicit column list.
-- New self-service columns have to be added to that grant or an owner cannot
-- edit what they just submitted.
grant update (whatsapp, latitude, longitude) on providers to authenticated;
