/*
  # Color Studio Timeline System - Professional Color Grading Platform
  
  ## Overview
  Complete timeline-based color grading system with advanced marker collaboration,
  per-take color correction, intelligent LUT management, and color space conversion.
  
  ## New Tables
  
  ### `projects`
  Stores color grading projects with format specifications
  - `id` (uuid, primary key)
  - `name` (text) - Project name
  - `format` (text) - Output format: 'SDR', 'HDR_REC2020', 'DOLBY_VISION_P3'
  - `client_id` (uuid) - Reference to client user
  - `colorist_id` (uuid) - Reference to colorist user
  - `status` (text) - 'draft', 'in_review', 'approved', 'completed'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `timeline_takes`
  Individual video takes in the timeline with ordering
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key)
  - `name` (text) - Take name/label
  - `order_index` (integer) - Position in timeline (reorderable)
  - `source_url` (text) - Original file URL
  - `duration` (numeric) - Duration in seconds
  - `fps` (numeric) - Frame rate
  - `resolution` (text) - e.g., "3840x2160"
  - `codec` (text) - e.g., "BRAW", "ProRes", "H265"
  - `color_space` (text) - Detected: 'REC709', 'REC2020', 'BRAW_FILM_GEN5', 'ARRI_LOG_C', etc.
  - `gamma` (text) - 'LINEAR', 'LOG', 'SRGB', 'PQ', 'HLG'
  - `bit_depth` (integer) - 8, 10, 12, 16
  - `created_at` (timestamptz)
  
  ### `color_corrections`
  Primary color correction settings per take
  - `id` (uuid, primary key)
  - `take_id` (uuid, foreign key)
  - `version` (text) - 'client' or 'colorist'
  - `exposure` (numeric) - -3.0 to +3.0
  - `contrast` (numeric) - 0.0 to 2.0
  - `highlights` (numeric) - -100 to +100
  - `shadows` (numeric) - -100 to +100
  - `whites` (numeric) - -100 to +100
  - `blacks` (numeric) - -100 to +100
  - `temperature` (numeric) - -100 to +100 (kelvin shift)
  - `tint` (numeric) - -100 to +100 (magenta/green)
  - `saturation` (numeric) - 0.0 to 2.0
  - `vibrance` (numeric) - -100 to +100
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `lut_assignments`
  LUT selections per take with conversion + creative LUTs
  - `id` (uuid, primary key)
  - `take_id` (uuid, foreign key)
  - `version` (text) - 'client' or 'colorist'
  - `conversion_lut` (text) - Color space conversion LUT (automatic)
  - `creative_lut` (text) - Visual/creative LUT (user selected)
  - `lut_intensity` (numeric) - 0.0 to 1.0
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `markers`
  Interactive markers with client/colorist collaboration
  - `id` (uuid, primary key)
  - `take_id` (uuid, foreign key)
  - `timecode` (numeric) - Position in seconds
  - `frame_number` (integer) - Exact frame
  - `type` (text) - 'note', 'issue', 'approval', 'question', 'change_request'
  - `category` (text) - 'color', 'exposure', 'composition', 'general'
  - `author_id` (uuid) - User who created marker
  - `author_role` (text) - 'client' or 'colorist'
  - `text` (text) - Marker comment/note
  - `status` (text) - 'open', 'in_progress', 'resolved', 'wont_fix'
  - `parent_marker_id` (uuid) - For threaded replies (nullable)
  - `drawing_data` (jsonb) - Optional drawing/annotation data
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `lut_library`
  Available LUTs organized by color space and purpose
  - `id` (uuid, primary key)
  - `name` (text) - LUT display name
  - `filename` (text) - File name in storage
  - `category` (text) - 'conversion', 'creative', 'vendor'
  - `source_color_space` (text) - Input color space
  - `target_color_space` (text) - Output color space
  - `format` (text) - 'CUBE', '3DL', 'ICC'
  - `description` (text)
  - `preview_url` (text) - Thumbnail/preview
  - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Clients can view/edit their projects and add markers
  - Colorists can view/edit assigned projects and respond to markers
  - Authentication required for all operations
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  format text NOT NULL CHECK (format IN ('SDR', 'HDR_REC2020', 'DOLBY_VISION_P3')),
  client_id uuid,
  colorist_id uuid,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = colorist_id);

CREATE POLICY "Clients can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Project members can update"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = colorist_id)
  WITH CHECK (auth.uid() = client_id OR auth.uid() = colorist_id);

-- Timeline takes table
CREATE TABLE IF NOT EXISTS timeline_takes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  source_url text NOT NULL,
  duration numeric NOT NULL DEFAULT 0,
  fps numeric NOT NULL DEFAULT 24,
  resolution text DEFAULT '1920x1080',
  codec text,
  color_space text,
  gamma text,
  bit_depth integer DEFAULT 8,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE timeline_takes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view takes in their projects"
  ON timeline_takes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = timeline_takes.project_id
      AND (projects.client_id = auth.uid() OR projects.colorist_id = auth.uid())
    )
  );

CREATE POLICY "Project members can manage takes"
  ON timeline_takes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = timeline_takes.project_id
      AND (projects.client_id = auth.uid() OR projects.colorist_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = timeline_takes.project_id
      AND (projects.client_id = auth.uid() OR projects.colorist_id = auth.uid())
    )
  );

-- Color corrections table
CREATE TABLE IF NOT EXISTS color_corrections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  take_id uuid NOT NULL REFERENCES timeline_takes(id) ON DELETE CASCADE,
  version text NOT NULL CHECK (version IN ('client', 'colorist')),
  exposure numeric DEFAULT 0,
  contrast numeric DEFAULT 1.0,
  highlights numeric DEFAULT 0,
  shadows numeric DEFAULT 0,
  whites numeric DEFAULT 0,
  blacks numeric DEFAULT 0,
  temperature numeric DEFAULT 0,
  tint numeric DEFAULT 0,
  saturation numeric DEFAULT 1.0,
  vibrance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(take_id, version)
);

ALTER TABLE color_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view corrections for their project takes"
  ON color_corrections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM timeline_takes
      JOIN projects ON projects.id = timeline_takes.project_id
      WHERE timeline_takes.id = color_corrections.take_id
      AND (projects.client_id = auth.uid() OR projects.colorist_id = auth.uid())
    )
  );

CREATE POLICY "Project members can manage corrections"
  ON color_corrections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM timeline_takes
      JOIN projects ON projects.id = timeline_takes.project_id
      WHERE timeline_takes.id = color_corrections.take_id
      AND (projects.client_id = auth.uid() OR projects.colorist_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timeline_takes
      JOIN projects ON projects.id = timeline_takes.project_id
      WHERE timeline_takes.id = color_corrections.take_id
      AND (projects.client_id = auth.uid() OR projects.colorist_id = auth.uid())
    )
  );

-- LUT assignments table
CREATE TABLE IF NOT EXISTS lut_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  take_id uuid NOT NULL REFERENCES timeline_takes(id) ON DELETE CASCADE,
  version text NOT NULL CHECK (version IN ('client', 'colorist')),
  conversion_lut text,
  creative_lut text,
  lut_intensity numeric DEFAULT 1.0 CHECK (lut_intensity >= 0 AND lut_intensity <= 1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(take_id, version)
);

ALTER TABLE lut_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view LUT assignments for their project takes"
  ON lut_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM timeline_takes
      JOIN projects ON projects.id = timeline_takes.project_id
      WHERE timeline_takes.id = lut_assignments.take_id
      AND (projects.client_id = auth.uid() OR projects.colorist_id = auth.uid())
    )
  );

CREATE POLICY "Project members can manage LUT assignments"
  ON lut_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM timeline_takes
      JOIN projects ON projects.id = timeline_takes.project_id
      WHERE timeline_takes.id = lut_assignments.take_id
      AND (projects.client_id = auth.uid() OR projects.colorist_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timeline_takes
      JOIN projects ON projects.id = timeline_takes.project_id
      WHERE timeline_takes.id = lut_assignments.take_id
      AND (projects.client_id = auth.uid() OR projects.colorist_id = auth.uid())
    )
  );

-- Markers table
CREATE TABLE IF NOT EXISTS markers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  take_id uuid NOT NULL REFERENCES timeline_takes(id) ON DELETE CASCADE,
  timecode numeric NOT NULL,
  frame_number integer NOT NULL,
  type text NOT NULL CHECK (type IN ('note', 'issue', 'approval', 'question', 'change_request')),
  category text NOT NULL CHECK (category IN ('color', 'exposure', 'composition', 'general')),
  author_id uuid NOT NULL,
  author_role text NOT NULL CHECK (author_role IN ('client', 'colorist')),
  text text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
  parent_marker_id uuid REFERENCES markers(id) ON DELETE CASCADE,
  drawing_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE markers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view markers in their project takes"
  ON markers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM timeline_takes
      JOIN projects ON projects.id = timeline_takes.project_id
      WHERE timeline_takes.id = markers.take_id
      AND (projects.client_id = auth.uid() OR projects.colorist_id = auth.uid())
    )
  );

CREATE POLICY "Project members can create markers"
  ON markers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM timeline_takes
      JOIN projects ON projects.id = timeline_takes.project_id
      WHERE timeline_takes.id = markers.take_id
      AND (projects.client_id = auth.uid() OR projects.colorist_id = auth.uid())
    )
  );

CREATE POLICY "Marker authors can update own markers"
  ON markers FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Project members can delete markers"
  ON markers FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM timeline_takes
      JOIN projects ON projects.id = timeline_takes.project_id
      WHERE timeline_takes.id = markers.take_id
      AND projects.colorist_id = auth.uid()
    )
  );

-- LUT library table
CREATE TABLE IF NOT EXISTS lut_library (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  filename text NOT NULL,
  category text NOT NULL CHECK (category IN ('conversion', 'creative', 'vendor')),
  source_color_space text,
  target_color_space text,
  format text DEFAULT 'CUBE' CHECK (format IN ('CUBE', '3DL', 'ICC')),
  description text,
  preview_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lut_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view LUT library"
  ON lut_library FOR SELECT
  TO authenticated
  USING (true);

-- Insert default conversion LUTs
INSERT INTO lut_library (name, filename, category, source_color_space, target_color_space, description) VALUES
  ('BRAW Film Gen5 to Rec709', 'braw_filmgen5_to_rec709.cube', 'conversion', 'BRAW_FILM_GEN5', 'REC709', 'Converts BRAW Film Gen 5 to Rec.709'),
  ('BRAW Film Gen5 to Rec2020', 'braw_filmgen5_to_rec2020.cube', 'conversion', 'BRAW_FILM_GEN5', 'REC2020', 'Converts BRAW Film Gen 5 to Rec.2020 HDR'),
  ('BRAW Film Gen5 to P3-D65', 'braw_filmgen5_to_p3d65.cube', 'conversion', 'BRAW_FILM_GEN5', 'P3_D65', 'Converts BRAW Film Gen 5 to DCI-P3 D65'),
  ('ARRI LogC3 to Rec709', 'arri_logc3_to_rec709.cube', 'conversion', 'ARRI_LOG_C3', 'REC709', 'Converts ARRI Log C3 to Rec.709'),
  ('ARRI LogC3 to Rec2020', 'arri_logc3_to_rec2020.cube', 'conversion', 'ARRI_LOG_C3', 'REC2020', 'Converts ARRI Log C3 to Rec.2020 HDR'),
  ('RED IPP2 to Rec709', 'red_ipp2_to_rec709.cube', 'conversion', 'RED_IPP2', 'REC709', 'Converts RED IPP2 to Rec.709'),
  ('RED IPP2 to Rec2020', 'red_ipp2_to_rec2020.cube', 'conversion', 'RED_IPP2', 'REC2020', 'Converts RED IPP2 to Rec.2020 HDR'),
  ('Sony S-Log3 to Rec709', 'sony_slog3_to_rec709.cube', 'conversion', 'SONY_SLOG3', 'REC709', 'Converts Sony S-Log3 to Rec.709'),
  ('Rec709 to Rec2020', 'rec709_to_rec2020.cube', 'conversion', 'REC709', 'REC2020', 'Converts Rec.709 to Rec.2020 HDR'),
  ('Rec709 to P3-D65', 'rec709_to_p3d65.cube', 'conversion', 'REC709', 'P3_D65', 'Converts Rec.709 to DCI-P3 D65'),
  
  ('Cinematic Teal Orange', 'cinematic_teal_orange.cube', 'creative', null, null, 'Popular teal and orange color grade'),
  ('Vintage Film Look', 'vintage_film.cube', 'creative', null, null, 'Vintage film emulation look'),
  ('High Contrast BW', 'high_contrast_bw.cube', 'creative', null, null, 'High contrast black and white'),
  ('Warm Sunset', 'warm_sunset.cube', 'creative', null, null, 'Warm golden hour tones'),
  ('Cool Moonlight', 'cool_moonlight.cube', 'creative', null, null, 'Cool blue moonlight tones'),
  ('Bleach Bypass', 'bleach_bypass.cube', 'creative', null, null, 'Desaturated bleach bypass effect')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_timeline_takes_project ON timeline_takes(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_takes_order ON timeline_takes(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_markers_take ON markers(take_id);
CREATE INDEX IF NOT EXISTS idx_markers_parent ON markers(parent_marker_id);
CREATE INDEX IF NOT EXISTS idx_color_corrections_take ON color_corrections(take_id);
CREATE INDEX IF NOT EXISTS idx_lut_assignments_take ON lut_assignments(take_id);
