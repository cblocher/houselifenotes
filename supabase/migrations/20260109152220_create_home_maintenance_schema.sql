/*
  # House Life Notes - Complete Database Schema

  ## Overview
  This migration creates a comprehensive database schema for tracking home maintenance,
  appliances, and costs for single-family homeowners.

  ## New Tables

  ### 1. houses
  Main table storing house information for each user
  - `id` (uuid, primary key) - Unique house identifier
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `year_built` (integer) - Year the house was built
  - `year_bought` (integer) - Year the user bought the house
  - `square_footage` (integer) - Total square footage
  - `realtor_name` (text) - Name of realtor used
  - `price_paid` (numeric) - Purchase price
  - `price_sold` (numeric, nullable) - Sale price (when sold)
  - `year_sold` (integer, nullable) - Year sold
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 2. rooms
  Tracks room types and counts in the house
  - `id` (uuid, primary key)
  - `house_id` (uuid, foreign key) - Links to houses
  - `room_type` (text) - Type of room (bedroom, bathroom, kitchen, etc.)
  - `count` (integer) - Number of rooms of this type
  - `notes` (text, nullable) - Additional notes
  - `created_at` (timestamptz)

  ### 3. interior_appliances
  Tracks interior appliances and their maintenance
  - `id` (uuid, primary key)
  - `house_id` (uuid, foreign key)
  - `appliance_type` (text) - Type (refrigerator, stove, HVAC, water heater, etc.)
  - `brand` (text, nullable) - Brand name
  - `model` (text, nullable) - Model number
  - `date_purchased` (date, nullable) - Purchase date
  - `date_installed` (date, nullable) - Installation date
  - `installer_name` (text, nullable) - Who installed it
  - `purchase_cost` (numeric) - Purchase cost
  - `installation_cost` (numeric) - Installation cost
  - `notes` (text, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. appliance_repairs
  Tracks repairs for interior appliances
  - `id` (uuid, primary key)
  - `appliance_id` (uuid, foreign key) - Links to interior_appliances
  - `repair_date` (date) - Date of repair
  - `repair_cost` (numeric) - Cost of repair
  - `technician_name` (text, nullable) - Who did the repair
  - `description` (text) - Description of repair
  - `created_at` (timestamptz)

  ### 5. exterior_features
  Tracks exterior features and structures
  - `id` (uuid, primary key)
  - `house_id` (uuid, foreign key)
  - `feature_type` (text) - Type (barn, shed, deck, paved_area, etc.)
  - `description` (text) - Description
  - `size` (text, nullable) - Size/dimensions
  - `date_built` (date, nullable) - When built
  - `build_cost` (numeric) - Cost to build
  - `builder_name` (text, nullable) - Who built it
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. property_details
  Tracks property details like acreage and sewage type
  - `id` (uuid, primary key)
  - `house_id` (uuid, foreign key, unique) - One-to-one with houses
  - `acreage` (numeric, nullable) - Property acreage
  - `sewage_type` (text) - Type (municipal, septic, gray_water)
  - `lot_description` (text, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 7. exterior_maintenance
  Tracks exterior maintenance activities
  - `id` (uuid, primary key)
  - `house_id` (uuid, foreign key)
  - `maintenance_type` (text) - Type (roofing, siding, painting, paving, etc.)
  - `maintenance_date` (date) - Date of maintenance
  - `cost` (numeric) - Cost
  - `contractor_name` (text, nullable) - Who did the work
  - `description` (text) - Description of work
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own house data
  - Authenticated users required for all operations
*/

-- Create houses table
CREATE TABLE IF NOT EXISTS houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year_built integer,
  year_bought integer,
  square_footage integer,
  realtor_name text,
  price_paid numeric(12, 2) DEFAULT 0,
  price_sold numeric(12, 2),
  year_sold integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  room_type text NOT NULL,
  count integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create interior_appliances table
CREATE TABLE IF NOT EXISTS interior_appliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  appliance_type text NOT NULL,
  brand text,
  model text,
  date_purchased date,
  date_installed date,
  installer_name text,
  purchase_cost numeric(12, 2) DEFAULT 0,
  installation_cost numeric(12, 2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create appliance_repairs table
CREATE TABLE IF NOT EXISTS appliance_repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appliance_id uuid REFERENCES interior_appliances(id) ON DELETE CASCADE NOT NULL,
  repair_date date NOT NULL,
  repair_cost numeric(12, 2) DEFAULT 0,
  technician_name text,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create exterior_features table
CREATE TABLE IF NOT EXISTS exterior_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  feature_type text NOT NULL,
  description text NOT NULL,
  size text,
  date_built date,
  build_cost numeric(12, 2) DEFAULT 0,
  builder_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property_details table
CREATE TABLE IF NOT EXISTS property_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid REFERENCES houses(id) ON DELETE CASCADE NOT NULL UNIQUE,
  acreage numeric(10, 2),
  sewage_type text DEFAULT 'municipal',
  lot_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exterior_maintenance table
CREATE TABLE IF NOT EXISTS exterior_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  maintenance_type text NOT NULL,
  maintenance_date date NOT NULL,
  cost numeric(12, 2) DEFAULT 0,
  contractor_name text,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE interior_appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exterior_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE exterior_maintenance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for houses table
CREATE POLICY "Users can view own houses"
  ON houses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own houses"
  ON houses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own houses"
  ON houses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own houses"
  ON houses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for rooms table
CREATE POLICY "Users can view own rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = rooms.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = rooms.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = rooms.house_id AND houses.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = rooms.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = rooms.house_id AND houses.user_id = auth.uid()
  ));

-- RLS Policies for interior_appliances table
CREATE POLICY "Users can view own appliances"
  ON interior_appliances FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = interior_appliances.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own appliances"
  ON interior_appliances FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = interior_appliances.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own appliances"
  ON interior_appliances FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = interior_appliances.house_id AND houses.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = interior_appliances.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own appliances"
  ON interior_appliances FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = interior_appliances.house_id AND houses.user_id = auth.uid()
  ));

-- RLS Policies for appliance_repairs table
CREATE POLICY "Users can view own repairs"
  ON appliance_repairs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM interior_appliances ia
    JOIN houses h ON h.id = ia.house_id
    WHERE ia.id = appliance_repairs.appliance_id AND h.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own repairs"
  ON appliance_repairs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM interior_appliances ia
    JOIN houses h ON h.id = ia.house_id
    WHERE ia.id = appliance_repairs.appliance_id AND h.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own repairs"
  ON appliance_repairs FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM interior_appliances ia
    JOIN houses h ON h.id = ia.house_id
    WHERE ia.id = appliance_repairs.appliance_id AND h.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM interior_appliances ia
    JOIN houses h ON h.id = ia.house_id
    WHERE ia.id = appliance_repairs.appliance_id AND h.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own repairs"
  ON appliance_repairs FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM interior_appliances ia
    JOIN houses h ON h.id = ia.house_id
    WHERE ia.id = appliance_repairs.appliance_id AND h.user_id = auth.uid()
  ));

-- RLS Policies for exterior_features table
CREATE POLICY "Users can view own exterior features"
  ON exterior_features FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = exterior_features.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own exterior features"
  ON exterior_features FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = exterior_features.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own exterior features"
  ON exterior_features FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = exterior_features.house_id AND houses.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = exterior_features.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own exterior features"
  ON exterior_features FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = exterior_features.house_id AND houses.user_id = auth.uid()
  ));

-- RLS Policies for property_details table
CREATE POLICY "Users can view own property details"
  ON property_details FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = property_details.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own property details"
  ON property_details FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = property_details.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own property details"
  ON property_details FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = property_details.house_id AND houses.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = property_details.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own property details"
  ON property_details FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = property_details.house_id AND houses.user_id = auth.uid()
  ));

-- RLS Policies for exterior_maintenance table
CREATE POLICY "Users can view own exterior maintenance"
  ON exterior_maintenance FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = exterior_maintenance.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own exterior maintenance"
  ON exterior_maintenance FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = exterior_maintenance.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own exterior maintenance"
  ON exterior_maintenance FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = exterior_maintenance.house_id AND houses.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = exterior_maintenance.house_id AND houses.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own exterior maintenance"
  ON exterior_maintenance FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM houses WHERE houses.id = exterior_maintenance.house_id AND houses.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS houses_user_id_idx ON houses(user_id);
CREATE INDEX IF NOT EXISTS rooms_house_id_idx ON rooms(house_id);
CREATE INDEX IF NOT EXISTS interior_appliances_house_id_idx ON interior_appliances(house_id);
CREATE INDEX IF NOT EXISTS appliance_repairs_appliance_id_idx ON appliance_repairs(appliance_id);
CREATE INDEX IF NOT EXISTS exterior_features_house_id_idx ON exterior_features(house_id);
CREATE INDEX IF NOT EXISTS property_details_house_id_idx ON property_details(house_id);
CREATE INDEX IF NOT EXISTS exterior_maintenance_house_id_idx ON exterior_maintenance(house_id);