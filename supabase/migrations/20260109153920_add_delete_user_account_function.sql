/*
  # Add Delete User Account Function

  1. New Functions
    - `delete_user_account()` - RPC function that safely deletes a user and all their data
  
  2. Changes
    - Creates a function that:
      - Deletes all exterior items for user's houses
      - Deletes all appliances for user's houses
      - Deletes all maintenance records for user's houses
      - Deletes all cost records for user's houses
      - Deletes all houses owned by the user
      - Deletes the user from auth.users
    - Function can only be called by authenticated users
    - Function only deletes the calling user's own data
  
  3. Security
    - Function enforces that users can only delete their own account
    - All deletions cascade properly to maintain referential integrity
*/

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM exterior_items WHERE house_id IN (
    SELECT id FROM houses WHERE user_id = user_uuid
  );

  DELETE FROM appliances WHERE house_id IN (
    SELECT id FROM houses WHERE user_id = user_uuid
  );

  DELETE FROM maintenance_records WHERE house_id IN (
    SELECT id FROM houses WHERE user_id = user_uuid
  );

  DELETE FROM cost_records WHERE house_id IN (
    SELECT id FROM houses WHERE user_id = user_uuid
  );

  DELETE FROM houses WHERE user_id = user_uuid;

  DELETE FROM auth.users WHERE id = user_uuid;
END;
$$;
