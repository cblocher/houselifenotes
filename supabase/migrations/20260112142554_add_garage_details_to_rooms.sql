/*
  # Add Garage Details to Rooms Table

  1. Changes
    - Add `garage_details` JSONB column to `rooms` table
    - This will store garage-specific attributes like:
      - one_car: boolean
      - two_car: boolean
      - other: boolean

  2. Notes
    - Uses JSONB for flexibility and to avoid adding multiple boolean columns
    - Only populated when room_type is "Garage"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'garage_details'
  ) THEN
    ALTER TABLE rooms ADD COLUMN garage_details jsonb DEFAULT NULL;
  END IF;
END $$;