/*
  # Add Purchase Location, Support Links, and Attachments to Appliances

  1. Changes to interior_appliances table
    - Add `purchase_location` (text) - Store or online location where purchased
    - Add `support_link` (text) - URL to manufacturer support or documentation
  
  2. New Tables
    - `appliance_attachments` - Store multiple attachments per appliance
      - `id` (uuid, primary key)
      - `appliance_id` (uuid, foreign key) - Links to interior_appliances
      - `file_name` (text) - Original file name
      - `file_url` (text) - URL to the stored file
      - `file_type` (text) - MIME type or file extension
      - `file_size` (integer) - File size in bytes
      - `description` (text, nullable) - Optional description
      - `created_at` (timestamptz)
  
  3. Security
    - Enable RLS on appliance_attachments table
    - Users can only access attachments for their own appliances
*/

-- Add new columns to interior_appliances
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interior_appliances' AND column_name = 'purchase_location'
  ) THEN
    ALTER TABLE interior_appliances ADD COLUMN purchase_location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interior_appliances' AND column_name = 'support_link'
  ) THEN
    ALTER TABLE interior_appliances ADD COLUMN support_link text;
  END IF;
END $$;

-- Create appliance_attachments table
CREATE TABLE IF NOT EXISTS appliance_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appliance_id uuid REFERENCES interior_appliances(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE appliance_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appliance_attachments
CREATE POLICY "Users can view own appliance attachments"
  ON appliance_attachments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM interior_appliances ia
    JOIN houses h ON h.id = ia.house_id
    WHERE ia.id = appliance_attachments.appliance_id AND h.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own appliance attachments"
  ON appliance_attachments FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM interior_appliances ia
    JOIN houses h ON h.id = ia.house_id
    WHERE ia.id = appliance_attachments.appliance_id AND h.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own appliance attachments"
  ON appliance_attachments FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM interior_appliances ia
    JOIN houses h ON h.id = ia.house_id
    WHERE ia.id = appliance_attachments.appliance_id AND h.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM interior_appliances ia
    JOIN houses h ON h.id = ia.house_id
    WHERE ia.id = appliance_attachments.appliance_id AND h.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own appliance attachments"
  ON appliance_attachments FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM interior_appliances ia
    JOIN houses h ON h.id = ia.house_id
    WHERE ia.id = appliance_attachments.appliance_id AND h.user_id = auth.uid()
  ));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS appliance_attachments_appliance_id_idx ON appliance_attachments(appliance_id);
