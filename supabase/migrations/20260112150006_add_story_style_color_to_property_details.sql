/*
  # Add Story, Build Style, and Color fields to Property Details

  1. Changes
    - Add `story` field to `property_details` table
      - Stores number of floors (1, 2, or Other)
      - Text type to accommodate "Other" option
    - Add `build_style` field to `property_details` table
      - Stores architectural style (Tudor, Craftsman, etc.)
      - Text type for flexibility
    - Add `color_type` field to `property_details` table
      - Stores color option (Siding, Paint, Other)
      - Text type for flexibility

  2. Notes
    - All fields are nullable to allow gradual data entry
    - Default values not set to allow empty state
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_details' AND column_name = 'story'
  ) THEN
    ALTER TABLE property_details ADD COLUMN story text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_details' AND column_name = 'build_style'
  ) THEN
    ALTER TABLE property_details ADD COLUMN build_style text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_details' AND column_name = 'color_type'
  ) THEN
    ALTER TABLE property_details ADD COLUMN color_type text;
  END IF;
END $$;