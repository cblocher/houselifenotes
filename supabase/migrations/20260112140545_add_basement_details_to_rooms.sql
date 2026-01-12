/*
  # Add Basement Details to Rooms Table

  1. Changes
    - Add `basement_details` JSONB column to `rooms` table
    - This will store basement-specific attributes like:
      - unfinished: boolean
      - partially_finished: boolean
      - finished: boolean
      - crawl_space: boolean

  2. Notes
    - Uses JSONB for flexibility and to avoid adding multiple boolean columns
    - Only populated when room_type is "Basement"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'basement_details'
  ) THEN
    ALTER TABLE rooms ADD COLUMN basement_details jsonb DEFAULT NULL;
  END IF;
END $$;