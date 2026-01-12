/*
  # Add "Other" text fields to Houses and Rooms

  1. Changes
    - Add `country_other` field to `houses` table
      - Stores custom text when "Other" is selected for Country
      - Text type for flexibility
    - Add `room_type_other` field to `rooms` table
      - Stores custom text when "Other" is selected for Room Type
      - Text type for flexibility

  2. Notes
    - All fields are nullable to allow gradual data entry
    - These fields are only used when the corresponding main field is set to "Other"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'houses' AND column_name = 'country_other'
  ) THEN
    ALTER TABLE houses ADD COLUMN country_other text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'room_type_other'
  ) THEN
    ALTER TABLE rooms ADD COLUMN room_type_other text;
  END IF;
END $$;