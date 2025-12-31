-- ============================================
-- KOYOT STUDIO - TEMPLATES SCHEMA
-- ============================================
-- Este schema define a estrutura de dados para o sistema de templates
-- do Koyot Studio, incluindo a tabela de templates e políticas RLS.

-- ============================================
-- ENUM TYPES
-- ============================================

-- Categorias de templates
CREATE TYPE template_category AS ENUM (
  'social_instagram',
  'social_linkedin', 
  'social_twitter',
  'social_facebook',
  'print_business_card',
  'print_flyer',
  'print_poster',
  'print_one_pager',
  'digital_web_banner',
  'digital_email_header',
  'digital_newsletter',
  'presentation',
  'report',
  'other'
);

-- Formatos de templates
CREATE TYPE template_format AS ENUM (
  'instagram_post',
  'instagram_story',
  'instagram_reel',
  'linkedin_post',
  'linkedin_banner',
  'twitter_post',
  'facebook_post',
  'facebook_cover',
  'business_card',
  'flyer_a5',
  'flyer_a4',
  'poster_a3',
  'one_pager',
  'web_banner_leaderboard',
  'web_banner_medium',
  'web_banner_skyscraper',
  'email_header',
  'custom'
);

-- ============================================
-- TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Metadados básicos
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category template_category NOT NULL DEFAULT 'other',
  format template_format NOT NULL DEFAULT 'custom',
  
  -- Preview
  thumbnail_url TEXT,
  
  -- Scene Graph (JSONB contendo a árvore de SceneNodes)
  root_node JSONB NOT NULL,
  
  -- Versionamento
  schema_version INTEGER NOT NULL DEFAULT 1,
  
  -- Organização
  tags TEXT[] DEFAULT '{}',
  
  -- Flags
  is_public BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  ai_generated BOOLEAN DEFAULT false,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT templates_name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT templates_root_node_valid CHECK (jsonb_typeof(root_node) = 'object')
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_templates_brand_id ON templates(brand_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_format ON templates(format);
CREATE INDEX idx_templates_created_at ON templates(created_at DESC);
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX idx_templates_root_node ON templates USING GIN(root_node);

-- ============================================
-- TRIGGERS
-- ============================================

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER templates_updated_at_trigger
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: membros da marca podem ver templates
CREATE POLICY "templates_select" ON templates
  FOR SELECT USING (
    -- Templates públicos são visíveis para todos
    is_public = true
    OR
    -- Membros da marca podem ver templates da marca
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = templates.brand_id 
      AND (brands.owner_id = auth.uid() OR brands.is_public = true)
    )
  );

-- Política de INSERT: apenas owner da marca pode criar templates
CREATE POLICY "templates_insert" ON templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = templates.brand_id 
      AND brands.owner_id = auth.uid()
    )
  );

-- Política de UPDATE: apenas owner da marca pode atualizar templates
CREATE POLICY "templates_update" ON templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = templates.brand_id 
      AND brands.owner_id = auth.uid()
    )
  );

-- Política de DELETE: apenas owner da marca pode deletar templates
CREATE POLICY "templates_delete" ON templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = templates.brand_id 
      AND brands.owner_id = auth.uid()
    )
  );

-- ============================================
-- TEMPLATE VERSIONS (para histórico)
-- ============================================

CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  root_node JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  comment TEXT,
  
  UNIQUE(template_id, version_number)
);

CREATE INDEX idx_template_versions_template_id ON template_versions(template_id);

ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_versions_select" ON template_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM templates t
      JOIN brands b ON b.id = t.brand_id
      WHERE t.id = template_versions.template_id
      AND (b.owner_id = auth.uid() OR t.is_public = true)
    )
  );

CREATE POLICY "template_versions_insert" ON template_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates t
      JOIN brands b ON b.id = t.brand_id
      WHERE t.id = template_versions.template_id
      AND b.owner_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Função para criar uma nova versão do template
CREATE OR REPLACE FUNCTION create_template_version(
  p_template_id UUID,
  p_comment TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_version_id UUID;
  v_next_version INTEGER;
  v_root_node JSONB;
BEGIN
  -- Obtém o próximo número de versão
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
  FROM template_versions
  WHERE template_id = p_template_id;
  
  -- Obtém o root_node atual
  SELECT root_node INTO v_root_node
  FROM templates
  WHERE id = p_template_id;
  
  -- Cria a versão
  INSERT INTO template_versions (template_id, version_number, root_node, created_by, comment)
  VALUES (p_template_id, v_next_version, v_root_node, auth.uid(), p_comment)
  RETURNING id INTO v_version_id;
  
  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para restaurar uma versão do template
CREATE OR REPLACE FUNCTION restore_template_version(
  p_version_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_template_id UUID;
  v_root_node JSONB;
BEGIN
  -- Obtém os dados da versão
  SELECT template_id, root_node INTO v_template_id, v_root_node
  FROM template_versions
  WHERE id = p_version_id;
  
  IF v_template_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Cria uma versão do estado atual antes de restaurar
  PERFORM create_template_version(v_template_id, 'Auto-save before restore');
  
  -- Restaura o template
  UPDATE templates
  SET root_node = v_root_node
  WHERE id = v_template_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE templates IS 'Armazena templates de design com Scene Graph em JSONB';
COMMENT ON COLUMN templates.root_node IS 'Árvore de SceneNodes no formato JSON (FrameNode como raiz)';
COMMENT ON COLUMN templates.schema_version IS 'Versão do schema para migrações futuras do formato JSONB';
COMMENT ON TABLE template_versions IS 'Histórico de versões dos templates para undo/redo persistente';
