/*
  # Add Location Fields to Houses Table

  1. Changes to Tables
    - Add location-related columns to `houses` table:
      - `address_line1` (text) - Primary street address
      - `address_line2` (text, nullable) - Apartment, unit, suite, etc.
      - `city` (text) - City name
      - `state_province` (text) - State/Province/Region
      - `postal_code` (text) - ZIP code, postal code, etc.
      - `country` (text, default 'United States') - Country name
  
  2. Notes
    - Fields are designed to be flexible for international addresses
    - `state_province` can accommodate US states, Canadian provinces, etc.
    - `postal_code` can handle various formats (ZIP, postal codes, etc.)
    - `country` defaults to United States but can be changed for international support
    - All location fields are optional to allow gradual data entry
*/

-- Add location fields to houses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'houses' AND column_name = 'address_line1'
  ) THEN
    ALTER TABLE houses ADD COLUMN address_line1 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'houses' AND column_name = 'address_line2'
  ) THEN
    ALTER TABLE houses ADD COLUMN address_line2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'houses' AND column_name = 'city'
  ) THEN
    ALTER TABLE houses ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'houses' AND column_name = 'state_province'
  ) THEN
    ALTER TABLE houses ADD COLUMN state_province text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'houses' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE houses ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'houses' AND column_name = 'country'
  ) THEN
    ALTER TABLE houses ADD COLUMN country text DEFAULT 'United States';
  END IF;
END $$;
