/*
  # Add Delete User Account Function

  1. New Functions
    - `delete_user_account()` - RPC function that deletes the authenticated user and all related house data.
  
  2. Changes
    - Creates a function that deletes the user from `auth.users`.
    - The `houses` table is defined with `ON DELETE CASCADE` for its dependent rows,
      so related data is removed automatically:
        - `rooms`
        - `interior_appliances`
        - `appliance_repairs`
        - `appliance_attachments`
        - `exterior_features`
        - `property_details`
        - `exterior_maintenance`
    - Function can only be called by authenticated users
    - Function only deletes the calling user's own data
  
  3. Security
    - Function enforces that users can only delete their own account
    - Deletions rely on referential integrity and cascade behavior in the current schema
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

  -- Delete the authenticated user. The houses table uses ON DELETE CASCADE,
  -- so related house records and their dependent rows are removed automatically.
  DELETE FROM auth.users WHERE id = user_uuid;
END;
$$;
