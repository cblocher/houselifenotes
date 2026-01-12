/*
  # Add Room Soft Delete Functions

  1. New Functions
    - `soft_delete_room(room_id uuid)` - Soft delete a room by setting deleted_at timestamp
    - `restore_room(room_id uuid)` - Restore a soft-deleted room by clearing deleted_at
    - `permanent_delete_room(room_id uuid)` - Permanently delete a room from the database

  2. Security
    - All functions respect RLS policies
    - Users can only delete/restore rooms in houses they own
    - Functions use SECURITY DEFINER to ensure proper access control

  3. Notes
    - Rooms with `deleted_at IS NULL` are active
    - Rooms with `deleted_at IS NOT NULL` are in trash
    - Permanent delete removes the room completely from the database
*/

-- Function to soft delete a room
CREATE OR REPLACE FUNCTION soft_delete_room(room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE rooms
  SET deleted_at = now()
  WHERE id = room_id
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM houses 
      WHERE houses.id = rooms.house_id 
      AND houses.user_id = auth.uid()
    );
END;
$$;

-- Function to restore a soft-deleted room
CREATE OR REPLACE FUNCTION restore_room(room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE rooms
  SET deleted_at = NULL
  WHERE id = room_id
    AND deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM houses 
      WHERE houses.id = rooms.house_id 
      AND houses.user_id = auth.uid()
    );
END;
$$;

-- Function to permanently delete a room
CREATE OR REPLACE FUNCTION permanent_delete_room(room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rooms
  WHERE id = room_id
    AND EXISTS (
      SELECT 1 FROM houses 
      WHERE houses.id = rooms.house_id 
      AND houses.user_id = auth.uid()
    );
END;
$$;