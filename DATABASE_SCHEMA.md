# 🗄️ Relational Database Schema Specification (PostgreSQL)

This document contains the production-grade, relational database definition language (DDL) matching the active TypeScript types of the application. It includes spatial indexes (using `PostGIS` or standard columns), security audit tables, and full integrity constraints.

---

## 🏗️ 1. Core Relational Schema (DDL)

Run these queries inside your PostgreSQL instance (e.g., hosted on Railway or Supabase) to set up your primary database shards.

```sql
-- Enable UUID extensions using modern standard gen_random_uuid() 
-- (built-in for PG 13+ without needing active admin permissions)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- TABLE: states_master
-- -------------------------------------------------------------
CREATE TABLE states_master (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- -------------------------------------------------------------
-- TABLE: cities_master
-- -------------------------------------------------------------
CREATE TABLE cities_master (
    id VARCHAR(50) PRIMARY KEY,
    state_id VARCHAR(50) REFERENCES states_master(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    UNIQUE(state_id, name)
);

-- -------------------------------------------------------------
-- TABLE: areas_master
-- -------------------------------------------------------------
CREATE TABLE areas_master (
    id VARCHAR(50) PRIMARY KEY,
    city_id VARCHAR(50) REFERENCES cities_master(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    UNIQUE(city_id, name, pincode)
);

-- -------------------------------------------------------------
-- TABLE: localities (Municipal Zone Shards)
-- -------------------------------------------------------------
CREATE TABLE localities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    subdomain VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- TABLE: categories
-- -------------------------------------------------------------
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(100) NOT NULL
);

-- -------------------------------------------------------------
-- TABLE: businesses (Listings Engine)
-- -------------------------------------------------------------
CREATE TABLE businesses (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    locality_id VARCHAR(50) NOT NULL REFERENCES localities(id) ON DELETE RESTRICT,
    state_id VARCHAR(50) REFERENCES states_master(id) ON DELETE SET NULL,
    city_id VARCHAR(50) REFERENCES cities_master(id) ON DELETE SET NULL,
    area_id VARCHAR(50) REFERENCES areas_master(id) ON DELETE SET NULL,
    areas_of_operation TEXT[] DEFAULT '{}', -- List of operating regions/pincodes
    address TEXT NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    website TEXT,
    description TEXT,
    rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INT DEFAULT 0,
    image_url TEXT,
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tags TEXT[] DEFAULT '{}',
    hours TEXT,
    owner_name VARCHAR(150),
    rejection_reason TEXT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    price_range VARCHAR(30) DEFAULT '₹' CHECK (LENGTH(price_range) BETWEEN 1 AND 10),
    delivery_available BOOLEAN DEFAULT FALSE,
    has_offers BOOLEAN DEFAULT FALSE,
    languages_spoken TEXT[] DEFAULT '{}',
    payment_methods TEXT[] DEFAULT '{}',
    experience_years INT DEFAULT 0,
    is_sponsored BOOLEAN DEFAULT FALSE,
    cpc_budget DECIMAL(10,2) DEFAULT 0.0,
    verified_badge BOOLEAN DEFAULT FALSE,
    kyc_status VARCHAR(20) DEFAULT 'none' CHECK (kyc_status IN ('verified', 'pending', 'none')),
    gov_registered BOOLEAN DEFAULT FALSE,
    response_time VARCHAR(50),
    customer_satisfaction INT CHECK (customer_satisfaction >= 0 AND customer_satisfaction <= 100),
    repeat_customer_score INT CHECK (repeat_customer_score >= 0 AND repeat_customer_score <= 100),
    is_monthly_subscriber BOOLEAN DEFAULT FALSE,
    subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium'))
);

-- -------------------------------------------------------------
-- TABLE: reviews (Trust Verification Layer)
-- -------------------------------------------------------------
CREATE TABLE reviews (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    user_phone VARCHAR(30) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_by_otp BOOLEAN DEFAULT FALSE,
    photo_url TEXT,
    video_url TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_votes INT DEFAULT 0,
    reported BOOLEAN DEFAULT FALSE,
    report_reason TEXT
);

-- -------------------------------------------------------------
-- TABLE: community_items (Discussion Bulletins)
-- -------------------------------------------------------------
CREATE TABLE community_items (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('qa', 'recommendation', 'event', 'deal', 'post')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(150) NOT NULL,
    author_phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    business_id VARCHAR(50) REFERENCES businesses(id) ON DELETE SET NULL,
    locality_id VARCHAR(50) NOT NULL REFERENCES localities(id) ON DELETE CASCADE,
    likes INT DEFAULT 0,
    answers_count INT DEFAULT 0,
    answers JSONB DEFAULT '[]', -- Nested structured discussions or linked answers
    event_date TIMESTAMP WITH TIME ZONE,
    deal_promo_code VARCHAR(50),
    price_tag VARCHAR(50),
    image TEXT,
    is_sponsored BOOLEAN DEFAULT FALSE
);

-- -------------------------------------------------------------
-- TABLE: crm_contacts
-- -------------------------------------------------------------
CREATE TABLE crm_contacts (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    follow_up_notes TEXT,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    orders_count INT DEFAULT 0,
    loyalty_points INT DEFAULT 0
);

-- -------------------------------------------------------------
-- TABLE: marketing_coupons (Lead Magnets)
-- -------------------------------------------------------------
CREATE TABLE marketing_coupons (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    discount VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    usage_count INT DEFAULT 0,
    UNIQUE(business_id, code)
);

-- -------------------------------------------------------------
-- TABLE: subdomain_mappings
-- -------------------------------------------------------------
CREATE TABLE subdomain_mappings (
    domain VARCHAR(150) PRIMARY KEY,
    locality_id VARCHAR(50) NOT NULL REFERENCES localities(id) ON DELETE CASCADE,
    ssl_enabled BOOLEAN DEFAULT FALSE,
    dns_status VARCHAR(20) DEFAULT 'pending' CHECK (dns_status IN ('active', 'pending', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- TABLE: compliance_audit_logs (IP & Device Tracer)
-- -------------------------------------------------------------
CREATE TABLE compliance_audit_logs (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('search', 'contact_view', 'data_entry')),
    description VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) NOT NULL, -- Supports both IPv4 AND IPv6 lengths
    device_code TEXT NOT NULL,       -- Complete Browser capabilities + UA + Res
    user_name VARCHAR(150) NOT NULL  -- Target Session Operator
);

---

## ⚡ 2. Performance Indexes & Triggers

To ensure fast read/write times even as your data grows, execute these indexing paths directly:

```sql
-- Fast index lookup for subdomains & slug routers
CREATE INDEX idx_localities_slug ON localities(slug);
CREATE INDEX idx_localities_subdomain ON localities(subdomain);

-- High speed category, locality filters on approved elements
CREATE INDEX idx_businesses_approved_lookup ON businesses(locality_id, category_id) WHERE status = 'approved';

-- Advanced GIN Indexing for multi-tag, multi-language searching
CREATE INDEX idx_businesses_tags ON businesses USING GIN(tags);
CREATE INDEX idx_businesses_operation_areas ON businesses USING GIN(areas_of_operation);

-- Audit query tracking optimize sorted backwards
CREATE INDEX idx_compliance_audit_timestamp ON compliance_audit_logs(timestamp DESC);
```

---

## 🔒 3. Automated Review Rating Sync (Trigger)

When a customer submits an OTP verified review, this database trigger automatically tallies average scores & rating counts over to the primary `businesses` directory:

```sql
CREATE OR REPLACE FUNCTION update_business_rating_cache()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE businesses
  SET 
    rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE business_id = NEW.business_id), 0.0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE business_id = NEW.business_id)
  WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_review_ratings
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_business_rating_cache();
```

---

## 4. Scalable Locality CMS Extensions

The platform is now moving beyond a single JSON homepage configuration model. For 200-500+ localities with locality-aware banners, ads, sponsored listings, and dynamic content, the backend needs structured configuration and published payload support.

```sql
-- Locality routing source of truth
CREATE TABLE platform_localities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    subdomain TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    cover_image TEXT NOT NULL DEFAULT '',
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    carousel_images TEXT[] NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE platform_subdomains (
    domain TEXT PRIMARY KEY,
    locality_id TEXT NOT NULL REFERENCES platform_localities(id) ON DELETE CASCADE,
    ssl_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    dns_status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE platform_pincode_mappings (
    pincode TEXT PRIMARY KEY,
    locality_id TEXT NOT NULL REFERENCES platform_localities(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Managed geography source of truth
CREATE TABLE platform_states (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE platform_cities (
    id TEXT PRIMARY KEY,
    state_id TEXT NOT NULL REFERENCES platform_states(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE platform_areas (
    id TEXT PRIMARY KEY,
    city_id TEXT NOT NULL REFERENCES platform_cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pincode TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- JSON-backed managed configuration keys currently stored in app_state
-- `homepage_defaults_config`
-- `seo_discovery_config`
-- These remain API/DB managed, but are still persisted as versioned JSON blobs
-- until they are promoted into fully normalized relational entities.

-- Managed taxonomy source of truth
CREATE TABLE business_categories (
    id TEXT PRIMARY KEY,
    legacy_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'category_icon',
    status TEXT NOT NULL DEFAULT 'active',
    sort_order INT NOT NULL DEFAULT 1,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE business_subcategories (
    id TEXT PRIMARY KEY,
    legacy_id BIGINT NOT NULL,
    parent_legacy_id BIGINT NOT NULL,
    category_id TEXT NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'subcategory_icon',
    status TEXT NOT NULL DEFAULT 'active',
    sort_order INT NOT NULL DEFAULT 1,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reusable homepage templates
CREATE TABLE cms_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    template_scope TEXT NOT NULL DEFAULT 'locality',
    locality_ids TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active',
    priority INT NOT NULL DEFAULT 100,
    is_fallback BOOLEAN NOT NULL DEFAULT FALSE,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locality/category/pincode-level template assignment rules
CREATE TABLE cms_template_assignments (
    id TEXT PRIMARY KEY,
    locality_id TEXT NOT NULL,
    template_id TEXT NOT NULL REFERENCES cms_templates(id) ON DELETE CASCADE,
    category_id TEXT,
    subcategory_id TEXT,
    pincode TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    priority INT NOT NULL DEFAULT 100,
    is_fallback BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Targeted hero banners, ads, offers, content blocks, and sponsored listing campaigns
CREATE TABLE cms_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    campaign_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    priority INT NOT NULL DEFAULT 100,
    is_fallback BOOLEAN NOT NULL DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    device_target TEXT NOT NULL DEFAULT 'all',
    placement_keys TEXT[] NOT NULL DEFAULT '{}',
    targets JSONB NOT NULL DEFAULT '{}'::jsonb,
    max_items INT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Published locality snapshots used for fast runtime delivery
CREATE TABLE published_homepage_snapshots (
    id TEXT PRIMARY KEY,
    locality_id TEXT NOT NULL,
    category_id TEXT,
    subcategory_id TEXT,
    pincode TEXT,
    device_target TEXT NOT NULL DEFAULT 'all',
    page_type TEXT NOT NULL DEFAULT 'homepage',
    payload JSONB NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cms_template_assignments_locality
    ON cms_template_assignments(locality_id);

CREATE INDEX idx_cms_template_assignments_targeting
    ON cms_template_assignments(locality_id, category_id, subcategory_id, pincode);

CREATE INDEX idx_cms_campaigns_type_status
    ON cms_campaigns(campaign_type, status, priority DESC);

CREATE INDEX idx_published_homepage_snapshots_lookup
    ON published_homepage_snapshots(locality_id, category_id, subcategory_id, pincode, device_target, page_type);

CREATE INDEX idx_platform_subdomains_locality
    ON platform_subdomains(locality_id);

CREATE INDEX idx_platform_pincode_locality
    ON platform_pincode_mappings(locality_id);

CREATE INDEX idx_platform_cities_state
    ON platform_cities(state_id);

CREATE INDEX idx_platform_areas_city
    ON platform_areas(city_id);

CREATE INDEX idx_platform_areas_pincode
    ON platform_areas(pincode);

CREATE INDEX idx_business_subcategories_category
    ON business_subcategories(category_id, sort_order);
```

### Runtime pattern

1. Author templates, targeting rules, and campaigns in relational tables.
2. Resolve the final homepage payload for a locality/category/device context on the backend.
3. Publish the resolved output into `published_homepage_snapshots`.
4. Serve published snapshots to frontend for fast reads and predictable overrides.
