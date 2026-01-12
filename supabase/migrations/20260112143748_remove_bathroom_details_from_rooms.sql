/*
  # Remove Bathroom Details from Rooms Table

  1. Changes
    - Remove `bathroom_details` JSONB column from `rooms` table
  
  2. Notes
    - This reverts the changes from migration 20260112143100_add_bathroom_details_to_rooms.sql
    - Any existing bathroom_details data will be lost
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'bathroom_details'
  ) THEN
    ALTER TABLE rooms DROP COLUMN bathroom_details;
  END IF;
END $$;
