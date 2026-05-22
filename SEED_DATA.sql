-- =========================================================================
-- 🗄️ PRODUCTION SEED DATA SCRIPT (Navi Mumbai, MH Nodes)
-- =========================================================================
-- Consistently ordered to prevent intermediate Foreign Key constraints failures!
-- Run this whole block in your Railway Postgres Editor or PGAdmin Query Tool.

SET client_encoding = 'UTF8';
BEGIN;

-- 1. SEED: states_master
INSERT INTO states_master (id, name) VALUES
('mh', 'Maharashtra')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. SEED: cities_master 
INSERT INTO cities_master (id, state_id, name) VALUES
('navimumbai', 'mh', 'Navi Mumbai'),
('mumbai', 'mh', 'Mumbai')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, state_id = EXCLUDED.state_id;

-- 3. SEED: areas_master
INSERT INTO areas_master (id, city_id, name, pincode) VALUES
('roadpali-sec17', 'navimumbai', 'Sector 17, Roadpali', '410218'),
('roadpali-sec15', 'navimumbai', 'Sector 15, Roadpali', '410218'),
('roadpali-sec20', 'navimumbai', 'Sector 20, Roadpali', '410218'),
('roadpali-sec9e', 'navimumbai', 'Sector 9E, Roadpali', '410218'),
('kalamboli-sec11', 'navimumbai', 'Sector 11, Kalamboli', '410218'),
('kalamboli-sec5', 'navimumbai', 'Sector 5E, Kalamboli', '410218'),
('kalamboli-sec2', 'navimumbai', 'Sector 2E, Kalamboli', '410218')
ON CONFLICT (id) DO UPDATE SET 
    city_id = EXCLUDED.city_id, 
    name = EXCLUDED.name, 
    pincode = EXCLUDED.pincode;

-- 4. SEED: localities
INSERT INTO localities (id, name, slug, subdomain, description, status, cover_image) VALUES
('roadpali', 'Roadpali, Navi Mumbai', 'roadpali', 'roadpali.happygifting.in', 'Explore verified family salons, trendy multi-cuisine dining hubs, and essential shops in the highly planned residential nodes of Roadpali.', 'active', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80'),
('kalamboli', 'Kalamboli, Navi Mumbai', 'kalamboli', 'kalamboli.happygifting.in', 'Connect with established spa academies, ladies dress boutiques, general medical stores, and trusted technical contractors across Kalamboli.', 'active', 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80'),
('kharghar', 'Kharghar, Navi Mumbai', 'kharghar', 'kharghar.happygifting.in', 'Find premium cafes, sports courts, wellness lounges, and educational consulting services in the highly aesthetic node of Kharghar.', 'active', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80'),
('kamothe', 'Kamothe, Navi Mumbai', 'kamothe', 'kamothe.happygifting.in', 'Connect with local supermarkets, home appliances workshops, tuition centers, and dental clinics across Kamothe nodes.', 'active', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80'),
('panvel', 'Panvel, Navi Mumbai', 'panvel', 'panvel.happygifting.in', 'Explore the traditional commercial capital of Navi Mumbai with historical food courts, diagnostic healthcare clinics, and transport centers.', 'active', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'),
('taloja', 'Taloja, Navi Mumbai', 'taloja', 'taloja.happygifting.in', 'Discover massive tooling industries, hardware stores, professional technical consultants, and logistics solutions based in Taloja.', 'active', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    slug = EXCLUDED.slug, 
    subdomain = EXCLUDED.subdomain, 
    description = EXCLUDED.description, 
    status = EXCLUDED.status, 
    cover_image = EXCLUDED.cover_image;

-- 5. SEED: categories
INSERT INTO categories (id, name, icon, color) VALUES
('salon', 'Salons & Wellness', 'Sparkles', 'bg-indigo-500/10 text-indigo-600'),
('food', 'Food & Dining', 'Utensils', 'bg-amber-500/10 text-amber-600'),
('retail', 'Shops & Retail', 'ShoppingBag', 'bg-pink-500/10 text-pink-600'),
('health', 'Health & Medical', 'HeartPulse', 'bg-rose-500/10 text-rose-600'),
('home', 'Home Services', 'Wrench', 'bg-orange-500/10 text-orange-600'),
('services', 'Professional Services', 'Briefcase', 'bg-purple-500/10 text-purple-600')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    icon = EXCLUDED.icon, 
    color = EXCLUDED.color;

-- 6. SEED: businesses (Verified real-world merchants)
INSERT INTO businesses (
    id, name, category_id, locality_id, state_id, city_id, area_id, 
    areas_of_operation, address, phone, email, website, description, 
    rating, review_count, image_url, featured, status, tags, hours, 
    owner_name, latitude, longitude, price_range, delivery_available, 
    has_offers, languages_spoken, payment_methods, experience_years, 
    is_sponsored, cpc_budget, verified_badge, kyc_status, gov_registered, 
    response_time, customer_satisfaction, repeat_customer_score, 
    is_monthly_subscriber, subscription_plan
) VALUES
(
    's1', 
    '5 Elements | Family Salon', 
    'salon', 
    'roadpali', 
    'mh', 
    'navimumbai', 
    'roadpali-sec17', 
    '{"roadpali-sec17", "roadpali-sec15", "kalamboli-sec11"}', 
    'Shop 11, Phoenix Heights, Sector 17, Roadpali, Navi Mumbai, Maharashtra 410218', 
    '+91 8655900456', 
    'info@5elementsfamily.in', 
    'https://5elementssalon.co.in', 
    'Premier family salon in Sector 17 providing luxury haircuts, dynamic hair styling, refreshing facials, and personalized grooming services inside an elite ambience.', 
    4.9, 
    3, 
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=500&q=80', 
    TRUE, 
    'approved', 
    '{"Haircut", "Styling", "Facial", "Grooming", "Family Salon"}', 
    '09:00 AM - 09:30 PM', 
    'Vikas Jaiswal', 
    19.0324, 
    73.1042, 
    '₹₹₹', 
    FALSE, 
    TRUE, 
    '{"Hindi", "English", "Marathi"}', 
    '{"UPI", "Card", "Cash"}', 
    7, 
    TRUE, 
    150.00, 
    TRUE, 
    'verified', 
    TRUE, 
    '< 10 mins', 
    98, 
    92, 
    TRUE, 
    'premium'
),
(
    's2', 
    'Majestic Salon Spa & Academy', 
    'salon', 
    'kalamboli', 
    'mh', 
    'navimumbai', 
    'kalamboli-sec11', 
    '{"kalamboli-sec11", "roadpali-sec17"}', 
    'Shop 8, Matruchaya Heritage Society, Sector 11, Kalamboli, Navi Mumbai, Maharashtra 410218', 
    '+91 8104084732', 
    'contact@majesticacademy.com', 
    'https://majesticsalonacademy.in', 
    'Elite cosmetic training institute and full-service beauty spa specializing in bridal transformations, deep therapeutic spa processes, and certified hairdressing styles.', 
    4.7, 
    2, 
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=500&q=80', 
    TRUE, 
    'approved', 
    '{"Spa", "Hair Academy", "Bridal", "Course", "Nail Art"}', 
    '10:00 AM - 09:00 PM', 
    'Priya Shinde', 
    19.0270, 
    73.1012, 
    '₹₹₹', 
    FALSE, 
    TRUE, 
    '{"Hindi", "Marathi", "English"}', 
    '{"UPI", "Card", "Cash"}', 
    10, 
    TRUE, 
    200.00, 
    TRUE, 
    'verified', 
    TRUE, 
    '< 15 mins', 
    95, 
    88, 
    TRUE, 
    'premium'
),
(
    'b11', 
    'Utsav Grand pure Veg Restaurant', 
    'food', 
    'roadpali', 
    'mh', 
    'navimumbai', 
    'roadpali-sec17', 
    '{"roadpali-sec17", "kalamboli-sec11"}', 
    'Shop 1-4, Ground Floor, Sector 17, Roadpali, Navi Mumbai, MH 410218', 
    '+91 22 2740 9012', 
    'contact@utsavgrand.co.in', 
    'https://utsavgrand.in', 
    'Famous family restaurant serving pure vegetarian North Indian delis, authentic South Indian crispy dosa plates, sizzling paneer, and rich kulfis.', 
    4.5, 
    2, 
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=500&q=80', 
    TRUE, 
    'approved', 
    '{"Pure Veg", "North Indian", "Family Dining", "Dosa"}', 
    '11:00 AM - 11:30 PM', 
    'Harish Shetty', 
    19.0320, 
    73.1045, 
    '₹₹', 
    TRUE, 
    TRUE, 
    '{"Hindi", "Marathi", "English"}', 
    '{"Cash", "UPI", "Card"}', 
    14, 
    FALSE, 
    60.00, 
    TRUE, 
    'verified', 
    TRUE, 
    '< 10 mins', 
    93, 
    85, 
    TRUE, 
    'basic'
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    category_id = EXCLUDED.category_id,
    locality_id = EXCLUDED.locality_id,
    rating = EXCLUDED.rating,
    review_count = EXCLUDED.review_count,
    cpc_budget = EXCLUDED.cpc_budget;

-- 7. SEED: reviews (Simulated verified customer feedback)
INSERT INTO reviews (
    id, business_id, user_name, user_phone, rating, comment, 
    verified_by_otp, is_verified_purchase, helpful_votes
) VALUES
('r1', 's1', 'Aarav Patil', '+91 98334 11223', 5, 'Highly skilled staff. Vikas personally recommended the haircut style and the styling is fantastic! Highly premium interior too.', TRUE, TRUE, 5),
('r2', 's1', 'Sneha Deshmukh', '+91 88790 44556', 5, 'Exceptional experience with their bridal facials and skin cleansing processes. Will visit regular now!', TRUE, TRUE, 3),
('r3', 's2', 'Rohan Sawant', '+91 99301 22334', 4, 'Very good spa academy. They are trained experts styling with sanitized gear.', TRUE, TRUE, 2),
('r4', 'b11', 'Amit Naik', '+91 98200 44550', 5, 'The masala dosa and paneer tikka dry is incredible. Excellent hygiene and quick seat allotment.', TRUE, TRUE, 6)
ON CONFLICT (id) DO UPDATE SET 
    comment = EXCLUDED.comment, 
    rating = EXCLUDED.rating;

-- 8. SEED: community_items (Discussion board & Local Announcements)
INSERT INTO community_items (
    id, type, title, content, author_name, author_phone, 
    business_id, locality_id, likes, answers_count, answers
) VALUES
(
    'c1', 
    'qa', 
    'Which is the most hygienic family salon in Sector 17, Roadpali?', 
    'Looking for local recommendations for hygienic trim setups with family-friendly rooms.', 
    'Rajesh Verma', 
    '+91 98834 22310', 
    NULL, 
    'roadpali', 
    12, 
    2, 
    '[{"author": "Nikhil G", "text": "Checkout 5 Elements Salon near Phoenix heights. Highly sanitized."}, {"author": "Meera", "text": "VRoyal is good too, but 5 Elements is very luxurious."}]'::jsonb
),
(
    'c2', 
    'deal', 
    'Flat 30% Off Bridal Treatment at Majestic Salon Spa', 
    'Claim exclusive discounts on advanced hair coloring & manicure sessions this weekend. Present code at counter.', 
    'Priya Shinde', 
    '+91 8104084732', 
    's2', 
    'kalamboli', 
    24, 
    0, 
    '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title, 
    content = EXCLUDED.content, 
    likes = EXCLUDED.likes;

-- 9. SEED: crm_contacts
INSERT INTO crm_contacts (
    id, business_id, name, phone, email, total_spent, orders_count, loyalty_points
) VALUES
('crm1', 's1', 'Aarav Patil', '+91 98334 11223', 'aarav.patil@gmail.com', 4500.00, 3, 450),
('crm2', 's1', 'Sneha Deshmukh', '+91 88790 44556', 'sneha.d@yahoo.com', 8900.00, 5, 890),
('crm3', 's2', 'Rohan Sawant', '+91 99301 22334', 'rohan.s@outlook.com', 1200.00, 1, 120)
ON CONFLICT (id) DO UPDATE SET 
    total_spent = EXCLUDED.total_spent, 
    orders_count = EXCLUDED.orders_count;

-- 10. SEED: marketing_coupons (Counter lead magnets)
INSERT INTO marketing_coupons (
    id, business_id, code, discount, description, expiry_date, usage_count
) VALUES
('cp1', 's1', 'ELEMENTS20', '20% OFF', 'Flat 20% discount on first-time hair styling & facial packages.', '2026-12-31 23:59:59+00', 45),
('cp2', 's2', 'MAJESTIC500', '₹500 OFF', 'Direct cashback voucher valid over high therapy couple spa packages.', '2026-10-31 23:59:59+00', 12)
ON CONFLICT (id) DO UPDATE SET 
    discount = EXCLUDED.discount, 
    usage_count = EXCLUDED.usage_count;

COMMIT;
