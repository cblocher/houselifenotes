/*
  # Add House Color field to Property Details

  1. Changes
    - Add `house_color` field to `property_details` table
      - Stores the actual color of the house as a hex color value
      - Text type to store hex color codes (e.g., #ffffff)

  2. Notes
    - Field is nullable to allow gradual data entry
    - No default value set to allow empty state
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_details' AND column_name = 'house_color'
  ) THEN
    ALTER TABLE property_details ADD COLUMN house_color text;
  END IF;
END $$;