/*
  # Add "Other" text fields to Property Details

  1. Changes
    - Add `story_other` field to `property_details` table
      - Stores custom text when "Other" is selected for Story
      - Text type for flexibility
    - Add `build_style_other` field to `property_details` table
      - Stores custom text when "Other" is selected for Build Style
      - Text type for flexibility
    - Add `color_type_other` field to `property_details` table
      - Stores custom text when "Other" is selected for Exterior Finish
      - Text type for flexibility

  2. Notes
    - All fields are nullable to allow gradual data entry
    - These fields are only used when the corresponding main field is set to "Other"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_details' AND column_name = 'story_other'
  ) THEN
    ALTER TABLE property_details ADD COLUMN story_other text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_details' AND column_name = 'build_style_other'
  ) THEN
    ALTER TABLE property_details ADD COLUMN build_style_other text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_details' AND column_name = 'color_type_other'
  ) THEN
    ALTER TABLE property_details ADD COLUMN color_type_other text;
  END IF;
END $$;