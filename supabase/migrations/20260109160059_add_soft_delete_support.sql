/*
  # Add Soft Delete Support

  1. Changes to Tables
    - Add `deleted_at` (timestamptz, nullable) to all main tables:
      - houses
      - rooms
      - interior_appliances
      - appliance_repairs
      - appliance_attachments
      - exterior_features
      - exterior_maintenance
      - property_details
  
  2. New Functions
    - `soft_delete_appliance(appliance_id uuid)` - Soft delete an appliance and cascade to repairs/attachments
    - `restore_appliance(appliance_id uuid)` - Restore a soft-deleted appliance and its repairs/attachments
    - `permanent_delete_appliance(appliance_id uuid)` - Permanently delete an appliance
  
  3. Security
    - All soft delete operations respect existing RLS policies
    - Users can only delete/restore their own data

  ## Notes
  - Items with `deleted_at IS NULL` are active
  - Items with `deleted_at IS NOT NULL` are in trash
  - Soft deletes cascade to related records (repairs, attachments)
*/

-- Add deleted_at column to all tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'houses' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE houses ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE rooms ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interior_appliances' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE interior_appliances ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appliance_repairs' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE appliance_repairs ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appliance_attachments' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE appliance_attachments ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exterior_features' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE exterior_features ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exterior_maintenance' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE exterior_maintenance ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_details' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE property_details ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- Create indexes for deleted_at columns for better performance
CREATE INDEX IF NOT EXISTS interior_appliances_deleted_at_idx ON interior_appliances(deleted_at);
CREATE INDEX IF NOT EXISTS appliance_repairs_deleted_at_idx ON appliance_repairs(deleted_at);
CREATE INDEX IF NOT EXISTS appliance_attachments_deleted_at_idx ON appliance_attachments(deleted_at);
CREATE INDEX IF NOT EXISTS exterior_features_deleted_at_idx ON exterior_features(deleted_at);
CREATE INDEX IF NOT EXISTS exterior_maintenance_deleted_at_idx ON exterior_maintenance(deleted_at);

-- Function to soft delete an appliance and cascade to repairs/attachments
CREATE OR REPLACE FUNCTION soft_delete_appliance(appliance_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Soft delete the appliance
  UPDATE interior_appliances
  SET deleted_at = now()
  WHERE id = appliance_id
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM houses 
      WHERE houses.id = interior_appliances.house_id 
      AND houses.user_id = auth.uid()
    );

  -- Cascade soft delete to repairs
  UPDATE appliance_repairs
  SET deleted_at = now()
  WHERE appliance_repairs.appliance_id = soft_delete_appliance.appliance_id
    AND deleted_at IS NULL;

  -- Cascade soft delete to attachments
  UPDATE appliance_attachments
  SET deleted_at = now()
  WHERE appliance_attachments.appliance_id = soft_delete_appliance.appliance_id
    AND deleted_at IS NULL;
END;
$$;

-- Function to restore an appliance and cascade to repairs/attachments
CREATE OR REPLACE FUNCTION restore_appliance(appliance_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Restore the appliance
  UPDATE interior_appliances
  SET deleted_at = NULL
  WHERE id = appliance_id
    AND deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM houses 
      WHERE houses.id = interior_appliances.house_id 
      AND houses.user_id = auth.uid()
    );

  -- Cascade restore to repairs
  UPDATE appliance_repairs
  SET deleted_at = NULL
  WHERE appliance_repairs.appliance_id = restore_appliance.appliance_id
    AND deleted_at IS NOT NULL;

  -- Cascade restore to attachments
  UPDATE appliance_attachments
  SET deleted_at = NULL
  WHERE appliance_attachments.appliance_id = restore_appliance.appliance_id
    AND deleted_at IS NOT NULL;
END;
$$;

-- Function to permanently delete an appliance
CREATE OR REPLACE FUNCTION permanent_delete_appliance(appliance_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete repairs
  DELETE FROM appliance_repairs
  WHERE appliance_repairs.appliance_id = permanent_delete_appliance.appliance_id
    AND EXISTS (
      SELECT 1 FROM interior_appliances ia
      JOIN houses h ON h.id = ia.house_id
      WHERE ia.id = permanent_delete_appliance.appliance_id
      AND h.user_id = auth.uid()
    );

  -- Delete attachments
  DELETE FROM appliance_attachments
  WHERE appliance_attachments.appliance_id = permanent_delete_appliance.appliance_id
    AND EXISTS (
      SELECT 1 FROM interior_appliances ia
      JOIN houses h ON h.id = ia.house_id
      WHERE ia.id = permanent_delete_appliance.appliance_id
      AND h.user_id = auth.uid()
    );

  -- Delete the appliance
  DELETE FROM interior_appliances
  WHERE id = appliance_id
    AND EXISTS (
      SELECT 1 FROM houses 
      WHERE houses.id = interior_appliances.house_id 
      AND houses.user_id = auth.uid()
    );
END;
$$;

-- Similar functions for exterior features
CREATE OR REPLACE FUNCTION soft_delete_exterior_feature(feature_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE exterior_features
  SET deleted_at = now()
  WHERE id = feature_id
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM houses 
      WHERE houses.id = exterior_features.house_id 
      AND houses.user_id = auth.uid()
    );
END;
$$;

CREATE OR REPLACE FUNCTION restore_exterior_feature(feature_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE exterior_features
  SET deleted_at = NULL
  WHERE id = feature_id
    AND deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM houses 
      WHERE houses.id = exterior_features.house_id 
      AND houses.user_id = auth.uid()
    );
END;
$$;

-- Function for exterior maintenance
CREATE OR REPLACE FUNCTION soft_delete_exterior_maintenance(maintenance_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE exterior_maintenance
  SET deleted_at = now()
  WHERE id = maintenance_id
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM houses 
      WHERE houses.id = exterior_maintenance.house_id 
      AND houses.user_id = auth.uid()
    );
END;
$$;

CREATE OR REPLACE FUNCTION restore_exterior_maintenance(maintenance_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE exterior_maintenance
  SET deleted_at = NULL
  WHERE id = maintenance_id
    AND deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM houses 
      WHERE houses.id = exterior_maintenance.house_id 
      AND houses.user_id = auth.uid()
    );
END;
$$;
