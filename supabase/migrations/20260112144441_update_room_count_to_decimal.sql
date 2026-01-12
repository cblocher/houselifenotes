/*
  # Update room count to support decimal values

  1. Changes
    - Modify `count` column in `rooms` table from integer to numeric(4,1)
    - This allows for half-bathroom counts like 1.5, 2.5, 3.5, etc.
  
  2. Notes
    - Uses numeric(4,1) to allow up to 999.9 rooms (4 total digits, 1 decimal place)
    - Existing integer values will be automatically converted to numeric
    - Default value remains 1
*/

DO $$
BEGIN
  -- Change count column from integer to numeric(4,1)
  ALTER TABLE rooms ALTER COLUMN count TYPE numeric(4,1);
END $$;
