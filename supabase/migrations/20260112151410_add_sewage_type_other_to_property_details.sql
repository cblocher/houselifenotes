/*
  # Add "Other" text field for Sewage Type

  1. Changes
    - Add `sewage_type_other` field to `property_details` table
      - Stores custom text when "Other" is selected for Sewage Type
      - Text type for flexibility

  2. Notes
    - Field is nullable to allow gradual data entry
    - Only used when sewage_type is set to "Other"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_details' AND column_name = 'sewage_type_other'
  ) THEN
    ALTER TABLE property_details ADD COLUMN sewage_type_other text;
  END IF;
END $$;