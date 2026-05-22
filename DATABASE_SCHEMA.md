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
