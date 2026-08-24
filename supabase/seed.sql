-- CareConnect India — DEMO seed data.
-- Every provider below is fictional: placeholder names, example.com emails and
-- non-routable phone numbers. Brief §28 sprint 6 replaces this with real,
-- hand-verified supply before any marketing launch. Do not ship this to production.

-- ---------------------------------------------------------------- cities

insert into cities (name, slug, state, wave, is_active, latitude, longitude) values
  ('Visakhapatnam','visakhapatnam','Andhra Pradesh','test_bed', true, 17.686800, 83.218500),
  ('Bangalore',    'bangalore',    'Karnataka',     'wave_1',   false, 12.971600, 77.594600),
  ('Hyderabad',    'hyderabad',    'Telangana',     'wave_1',   false, 17.385000, 78.486700),
  ('Chennai',      'chennai',      'Tamil Nadu',    'wave_1',   false, 13.082700, 80.270700),
  ('Kochi',        'kochi',        'Kerala',        'wave_1',   false,  9.931200, 76.267300),
  ('Coimbatore',   'coimbatore',   'Tamil Nadu',    'wave_1',   false, 11.016800, 76.955800),
  ('Pune',         'pune',         'Maharashtra',   'wave_1',   false, 18.520400, 73.856700),
  ('Ahmedabad',    'ahmedabad',    'Gujarat',       'wave_2',   false, 23.022500, 72.571400),
  ('Chandigarh',   'chandigarh',   'Chandigarh',    'wave_2',   false, 30.733300, 76.779400),
  ('Mysore',       'mysore',       'Karnataka',     'wave_2',   false, 12.295800, 76.639400),
  ('Jaipur',       'jaipur',       'Rajasthan',     'wave_2',   false, 26.912400, 75.787300),
  ('Mumbai',       'mumbai',       'Maharashtra',   'wave_3',   false, 19.076000, 72.877700),
  ('Delhi NCR',    'delhi-ncr',    'Delhi',         'wave_3',   false, 28.613900, 77.209000);

-- ---------------------------------------------------------------- taxonomy (brief §7)

insert into service_categories (name, slug, description, sort_order) values
  ('Home Care',      'home-care',      'Care delivered at the senior''s own home.',          1),
  ('Companionship',  'companionship',  'Company, conversation and day-to-day support.',      2),
  ('Rehabilitation', 'rehabilitation', 'Recovery and mobility therapy.',                     3),
  ('Cognitive Care', 'cognitive-care', 'Specialised care for memory and cognitive decline.', 4),
  ('Medical',        'medical',        'Doctor-led care for older adults.',                  5),
  ('Palliative',     'palliative',     'Comfort-focused care for advanced illness.',         6),
  ('Residential',    'residential',    'Care in a senior living or assisted living setting.',7);

insert into services (category_id, name, slug, description, sort_order)
select c.id, v.name, v.slug, v.description, v.sort_order
from (values
  ('home-care',     'Caregiver',                'caregiver',                'Trained attendant for daily living support.',        1),
  ('home-care',     'Attendant',                'attendant',                'Non-medical help with everyday routines.',           2),
  ('home-care',     'Nursing at Home',          'nursing-at-home',          'Qualified nurse visits or live-in nursing.',         3),
  ('home-care',     'Day Care',                 'day-care',                 'Supervised daytime care outside the home.',          4),
  ('home-care',     '24x7 Care',                '24x7-care',                'Round-the-clock cover, usually in shifts.',          5),
  ('companionship', 'Companion / Senior Support','companion-senior-support','Regular company and light assistance.',              1),
  ('rehabilitation','Physiotherapy',            'physiotherapy',            'Mobility, strength and post-surgery recovery.',      1),
  ('cognitive-care','Dementia Care',            'dementia-care',            'Specialist support for dementia and Alzheimer''s.',  1),
  ('medical',       'Geriatric Doctor',         'geriatric-doctor',         'Physician consultations for older adults.',          1),
  ('palliative',    'Palliative Care',          'palliative-care',          'Pain and symptom management, comfort care.',         1),
  ('residential',   'Senior Living',            'senior-living',            'Independent living communities for seniors.',        1),
  ('residential',   'Assisted Living',          'assisted-living',          'Residential care with daily support on site.',       2)
) as v(cat_slug, name, slug, description, sort_order)
join service_categories c on c.slug = v.cat_slug;

-- ---------------------------------------------------------------- demo providers

insert into providers (
  name, slug, description, city_id, areas_covered, languages, phone, email, website,
  pricing_band, established_year, staff_size, status, verification, tier
)
select
  v.name, v.slug, v.description, ct.id, v.areas, v.langs, v.phone, v.email, v.website,
  v.band::pricing_band, v.est, v.staff, v.status::provider_status, v.verif::verification_status, v.tier::listing_tier
from (values
  -- Visakhapatnam — the test bed, 20 providers (brief §5 supply target)
  ('Sagar Home Care Services','sagar-home-care-services','Home caregivers and attendants across central Vizag, with shift-based cover for families who need daytime or overnight support.','visakhapatnam',array['MVP Colony','Seethammadhara','Dwaraka Nagar'],array['Telugu','Hindi','English'],'+91 90000 10001','contact@sagar-home-care.example.com','https://sagar-home-care.example.com','mid',2016,'25-50','approved','careconnect_verified','premium'),
  ('Vizag Elder Support','vizag-elder-support','Attendant and companionship services for seniors living alone, including regular wellbeing visits for families based overseas.','visakhapatnam',array['Gajuwaka','Akkayyapalem'],array['Telugu','English'],'+91 90000 10002','hello@vizag-elder.example.com',null,'budget',2019,'10-25','approved','business_verified','standard'),
  ('Coastal Nursing at Home','coastal-nursing-home','Qualified nurses for post-hospital recovery, wound care and injections, delivered at home on a visit or live-in basis.','visakhapatnam',array['Siripuram','Lawsons Bay','Beach Road'],array['Telugu','Hindi','English'],'+91 90000 10003','care@coastal-nursing.example.com','https://coastal-nursing.example.com','premium',2014,'50-100','approved','credential_verified','premium'),
  ('Amrutha Senior Care','amrutha-senior-care','Long-running family-run agency offering caregivers, attendants and 24x7 rotational cover in north Vizag.','visakhapatnam',array['Madhurawada','PM Palem','Rushikonda'],array['Telugu','Hindi'],'+91 90000 10004','info@amrutha-senior.example.com',null,'mid',2011,'25-50','approved','business_verified','standard'),
  ('Sunrise Physiotherapy for Seniors','sunrise-physio-seniors','Home-visit physiotherapy focused on mobility, fall recovery and post-operative rehabilitation for older adults.','visakhapatnam',array['Dwaraka Nagar','Asilmetta'],array['Telugu','English'],'+91 90000 10005','book@sunrise-physio.example.com','https://sunrise-physio.example.com','mid',2018,'10-25','approved','credential_verified','standard'),
  ('Smrithi Dementia Care','smrithi-dementia-care','Specialist dementia and Alzheimer''s support, with trained caregivers and structured daily routines.','visakhapatnam',array['Seethammadhara','MVP Colony'],array['Telugu','English'],'+91 90000 10006','support@smrithi-care.example.com',null,'premium',2020,'10-25','approved','careconnect_verified','premium'),
  ('Bay City Attendants','bay-city-attendants','Affordable attendant services on daily and monthly plans, widely used for hospital and post-discharge cover.','visakhapatnam',array['Gopalapatnam','Kancharapalem'],array['Telugu'],'+91 90000 10007','contact@baycity-attendants.example.com',null,'budget',2021,'10-25','approved','unverified','free'),
  ('Kalyani Geriatric Clinic','kalyani-geriatric-clinic','Geriatric physician consultations at clinic and at home, including medication review and chronic condition follow-up.','visakhapatnam',array['Siripuram','Dwaraka Nagar'],array['Telugu','Hindi','English'],'+91 90000 10008','appointments@kalyani-geriatric.example.com','https://kalyani-geriatric.example.com','premium',2009,'10-25','approved','credential_verified','standard'),
  ('Shanti Palliative Services','shanti-palliative','Palliative and comfort care at home, with nurse-led pain management and family counselling.','visakhapatnam',array['Beach Road','Lawsons Bay','Siripuram'],array['Telugu','English'],'+91 90000 10009','care@shanti-palliative.example.com',null,'mid',2015,'25-50','approved','careconnect_verified','premium'),
  ('Green Meadows Assisted Living','green-meadows-assisted','Assisted living residence with on-site nursing, physiotherapy and 24-hour emergency response.','visakhapatnam',array['Madhurawada'],array['Telugu','Hindi','English'],'+91 90000 10010','enquiries@greenmeadows.example.com','https://greenmeadows.example.com','premium',2017,'50-100','approved','business_verified','premium'),
  ('Nithya Companionship','nithya-companionship','Companion visits for seniors living alone — conversation, walks, errands and a weekly update to the family.','visakhapatnam',array['MVP Colony','Seethammadhara','Asilmetta'],array['Telugu','English'],'+91 90000 10011','hello@nithya-companion.example.com',null,'budget',2022,'1-10','approved','business_verified','standard'),
  ('Arogya 24x7 Care','arogya-24x7','Round-the-clock caregiver cover in three shifts, with a supervisor assigned to every family.','visakhapatnam',array['Gajuwaka','Kurmannapalem'],array['Telugu','Hindi'],'+91 90000 10012','ops@arogya24x7.example.com',null,'mid',2018,'50-100','approved','business_verified','standard'),
  ('Tulasi Day Care for Seniors','tulasi-day-care','Daytime centre offering supervised activity, meals and physiotherapy, with pickup and drop available.','visakhapatnam',array['Dwaraka Nagar'],array['Telugu'],'+91 90000 10013','info@tulasi-daycare.example.com',null,'budget',2019,'10-25','approved','unverified','free'),
  ('Harita Home Nursing','harita-home-nursing','Nursing attendants for catheter care, feeding tubes and diabetic management under physician direction.','visakhapatnam',array['Akkayyapalem','Gopalapatnam'],array['Telugu','Hindi'],'+91 90000 10014','care@harita-nursing.example.com',null,'mid',2016,'25-50','approved','credential_verified','standard'),
  ('Vaishnavi Elder Attendants','vaishnavi-elder-attendants','Female attendants for female seniors, on request, with day and night shift options.','visakhapatnam',array['PM Palem','Madhurawada'],array['Telugu','English'],'+91 90000 10015','contact@vaishnavi-attendants.example.com',null,'budget',2020,'10-25','approved','business_verified','free'),
  ('Sea Breeze Senior Living','sea-breeze-senior-living','Independent senior living apartments with optional care packages and an on-call doctor.','visakhapatnam',array['Rushikonda'],array['Telugu','English','Hindi'],'+91 90000 10016','sales@seabreeze-living.example.com','https://seabreeze-living.example.com','premium',2013,'50-100','approved','business_verified','premium'),
  ('Prerana Rehab at Home','prerana-rehab-home','Post-stroke and post-fracture rehabilitation programmes delivered at home over 6 to 12 weeks.','visakhapatnam',array['Seethammadhara','Siripuram'],array['Telugu','English'],'+91 90000 10017','rehab@prerana-home.example.com',null,'mid',2021,'10-25','approved','credential_verified','standard'),
  ('Sravanthi Care Agency','sravanthi-care-agency','General caregiver placement for elderly parents, including replacement cover on leave days.','visakhapatnam',array['Kancharapalem','Gopalapatnam'],array['Telugu'],'+91 90000 10018','hello@sravanthi-care.example.com',null,'budget',2022,'1-10','approved','unverified','free'),
  ('Manasa Memory Care','manasa-memory-care','Day programme and home support for early to moderate dementia, run by trained cognitive care staff.','visakhapatnam',array['MVP Colony'],array['Telugu','English'],'+91 90000 10019','info@manasa-memory.example.com',null,'mid',2020,'10-25','approved','business_verified','standard'),
  ('Godavari Home Health','godavari-home-health','Combined nursing, physiotherapy and attendant packages managed by a single care coordinator.','visakhapatnam',array['Beach Road','Asilmetta','Dwaraka Nagar'],array['Telugu','Hindi','English'],'+91 90000 10020','coordinate@godavari-health.example.com','https://godavari-health.example.com','premium',2012,'100+','approved','careconnect_verified','premium'),

  -- Wave 1 sample supply
  ('Bengaluru Elder Care Collective','bengaluru-elder-care','Caregivers and nurses across south Bengaluru, with English-speaking coordinators for overseas families.','bangalore',array['Jayanagar','JP Nagar','Koramangala'],array['Kannada','English','Hindi','Tamil'],'+91 90000 20001','hello@blr-eldercare.example.com','https://blr-eldercare.example.com','premium',2015,'50-100','approved','careconnect_verified','premium'),
  ('Whitefield Home Nursing','whitefield-home-nursing','Home nursing and post-discharge care in east Bengaluru, including ICU-trained nurses.','bangalore',array['Whitefield','Marathahalli'],array['Kannada','English','Hindi'],'+91 90000 20002','care@whitefield-nursing.example.com',null,'mid',2018,'25-50','approved','credential_verified','standard'),
  ('Hyderabad Senior Companions','hyderabad-senior-companions','Companionship and errand support for seniors in Hyderabad, popular with families in the US and Gulf.','hyderabad',array['Banjara Hills','Jubilee Hills','Madhapur'],array['Telugu','Hindi','English','Urdu'],'+91 90000 30001','hello@hyd-companions.example.com','https://hyd-companions.example.com','mid',2019,'25-50','approved','business_verified','premium'),
  ('Deccan Dementia Support','deccan-dementia-support','Dementia-specialist caregivers and a family support group, serving central Hyderabad.','hyderabad',array['Secunderabad','Begumpet'],array['Telugu','Hindi','English'],'+91 90000 30002','support@deccan-dementia.example.com',null,'premium',2017,'10-25','approved','credential_verified','standard'),
  ('Chennai Care at Home','chennai-care-at-home','Attendants, nurses and physiotherapists across Chennai on flexible monthly plans.','chennai',array['Adyar','T Nagar','Velachery'],array['Tamil','English','Telugu'],'+91 90000 40001','contact@chennai-careathome.example.com','https://chennai-careathome.example.com','mid',2014,'50-100','approved','careconnect_verified','premium'),
  ('Kochi Geriatric Services','kochi-geriatric-services','Geriatric physician visits and nursing care across Ernakulam district.','kochi',array['Kakkanad','Edappally','Fort Kochi'],array['Malayalam','English','Hindi'],'+91 90000 50001','care@kochi-geriatric.example.com',null,'mid',2016,'25-50','approved','credential_verified','standard'),
  ('Coimbatore Elder Assist','coimbatore-elder-assist','Home caregivers and day care for seniors in and around Coimbatore city.','coimbatore',array['RS Puram','Peelamedu','Saibaba Colony'],array['Tamil','English'],'+91 90000 60001','hello@cbe-elderassist.example.com',null,'budget',2020,'10-25','approved','business_verified','standard'),
  ('Pune Parent Care','pune-parent-care','Full-service elder care in Pune — caregivers, nursing, physiotherapy and doctor coordination.','pune',array['Kothrud','Baner','Viman Nagar'],array['Marathi','Hindi','English'],'+91 90000 70001','hello@pune-parentcare.example.com','https://pune-parentcare.example.com','premium',2013,'50-100','approved','careconnect_verified','premium'),

  -- pipeline examples: must NOT appear in public search
  ('Pending Review Care Services','pending-review-care','Application submitted, awaiting CareConnect review. Should not be publicly listed.','visakhapatnam',array['MVP Colony'],array['Telugu'],'+91 90000 99001','pending@example.com',null,'budget',2023,'1-10','pending','unverified','free'),
  ('Inactive City Provider','inactive-city-provider','Located in a city that is not yet active. Should not be publicly listed.','jaipur',array['Malviya Nagar'],array['Hindi'],'+91 90000 99002','inactive@example.com',null,'mid',2018,'10-25','approved','business_verified','standard')
) as v(name, slug, description, city_slug, areas, langs, phone, email, website, band, est, staff, status, verif, tier)
join cities ct on ct.slug = v.city_slug;

-- Every demo listing answers WhatsApp on the number it takes calls on, which is
-- the ordinary case for a small provider. Real listings set this themselves
-- during registration, where the two numbers can differ.
update providers set whatsapp = phone where whatsapp is null;

-- A few dropped pins, so the directory has "Directions" links to show. Real
-- coordinates come from a provider standing at their own gate; these are
-- approximate points around Visakhapatnam and are demo data like the rest.
update providers set latitude = v.lat, longitude = v.lng
from (values
  ('sagar-home-care-services', 17.730700, 83.312400),
  ('coastal-nursing-home',     17.712300, 83.317800),
  ('green-meadows-assisted',   17.813500, 83.360200),
  ('sea-breeze-senior-living', 17.780900, 83.383600),
  ('shanti-palliative',        17.716400, 83.322900)
) as v(slug, lat, lng)
where providers.slug = v.slug;

-- ---------------------------------------------------------------- provider ↔ service links

insert into provider_services (provider_id, service_id)
select p.id, s.id
from (values
  ('sagar-home-care-services', array['caregiver','attendant','24x7-care']),
  ('vizag-elder-support',      array['attendant','companion-senior-support']),
  ('coastal-nursing-home',     array['nursing-at-home','caregiver']),
  ('amrutha-senior-care',      array['caregiver','attendant','24x7-care']),
  ('sunrise-physio-seniors',   array['physiotherapy']),
  ('smrithi-dementia-care',    array['dementia-care','caregiver']),
  ('bay-city-attendants',      array['attendant']),
  ('kalyani-geriatric-clinic', array['geriatric-doctor']),
  ('shanti-palliative',        array['palliative-care','nursing-at-home']),
  ('green-meadows-assisted',   array['assisted-living','nursing-at-home']),
  ('nithya-companionship',     array['companion-senior-support']),
  ('arogya-24x7',              array['24x7-care','caregiver']),
  ('tulasi-day-care',          array['day-care']),
  ('harita-home-nursing',      array['nursing-at-home']),
  ('vaishnavi-elder-attendants',array['attendant','caregiver']),
  ('sea-breeze-senior-living', array['senior-living']),
  ('prerana-rehab-home',       array['physiotherapy']),
  ('sravanthi-care-agency',    array['caregiver']),
  ('manasa-memory-care',       array['dementia-care','day-care']),
  ('godavari-home-health',     array['nursing-at-home','physiotherapy','caregiver']),
  ('bengaluru-elder-care',     array['caregiver','nursing-at-home','24x7-care']),
  ('whitefield-home-nursing',  array['nursing-at-home']),
  ('hyderabad-senior-companions',array['companion-senior-support','attendant']),
  ('deccan-dementia-support',  array['dementia-care']),
  ('chennai-care-at-home',     array['caregiver','nursing-at-home','physiotherapy']),
  ('kochi-geriatric-services', array['geriatric-doctor','nursing-at-home']),
  ('coimbatore-elder-assist',  array['caregiver','day-care']),
  ('pune-parent-care',         array['caregiver','nursing-at-home','physiotherapy','geriatric-doctor']),
  ('pending-review-care',      array['caregiver']),
  ('inactive-city-provider',   array['attendant'])
) as v(provider_slug, service_slugs)
join providers p on p.slug = v.provider_slug
join services  s on s.slug = any(v.service_slugs);
