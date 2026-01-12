/*
  # Add Bathroom Details to Rooms Table

  1. Changes
    - Add `bathroom_details` JSONB column to `rooms` table
    - This will store bathroom-specific attributes like:
      - one_toilet: boolean
      - one_half_toilet: boolean
      - two_toilet: boolean
      - two_half_toilet: boolean
      - other_toilet: boolean
      - one_shower: boolean
      - one_half_shower: boolean
      - two_shower: boolean
      - two_half_shower: boolean
      - other_shower: boolean

  2. Notes
    - Uses JSONB for flexibility and to avoid adding multiple boolean columns
    - Only populated when room_type is "Bathroom"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'bathroom_details'
  ) THEN
    ALTER TABLE rooms ADD COLUMN bathroom_details jsonb DEFAULT NULL;
  END IF;
END $$;