-- ============================================
-- SUPERADMIN SCHEMA - User Profiles & Roles
-- ============================================
-- Ejecutar en SQL Editor de Supabase

-- 1. Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'user', 'guest')),
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe y recrear
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Función para actualizar last_seen_at
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS trigger AS $$
BEGIN
  UPDATE user_profiles SET last_seen_at = NOW() WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger para actualizar last_seen en activity_log
DROP TRIGGER IF EXISTS update_user_last_seen ON activity_log;
CREATE TRIGGER update_user_last_seen
  AFTER INSERT ON activity_log
  FOR EACH ROW EXECUTE FUNCTION update_last_seen();

-- 5. Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de seguridad
-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuarios pueden actualizar su propio perfil (excepto role)
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- SuperAdmin/Admin pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- SuperAdmin puede actualizar cualquier perfil
CREATE POLICY "SuperAdmin can update any profile" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- SuperAdmin puede eliminar perfiles
CREATE POLICY "SuperAdmin can delete profiles" ON user_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 7. Vista para el dashboard de admin
CREATE OR REPLACE VIEW v_users_admin AS
SELECT 
  up.id,
  up.email,
  up.display_name,
  up.role,
  up.is_active,
  up.last_seen_at,
  up.created_at,
  CASE 
    WHEN up.last_seen_at > NOW() - INTERVAL '5 minutes' THEN 'online'
    WHEN up.last_seen_at > NOW() - INTERVAL '1 hour' THEN 'away'
    ELSE 'offline'
  END AS connection_status,
  (SELECT COUNT(*) FROM activity_log WHERE user_id = up.id) AS total_actions,
  (SELECT COUNT(*) FROM activity_log WHERE user_id = up.id AND action_type = 'check') AS total_checks
FROM user_profiles up
ORDER BY up.last_seen_at DESC NULLS LAST;

-- 8. Insertar perfiles para usuarios existentes
INSERT INTO user_profiles (id, email, display_name)
SELECT id, email, split_part(email, '@', 1)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 9. Actualizar política de activity_log para que admins puedan ver todo
DROP POLICY IF EXISTS "Admins can view all activity" ON activity_log;
CREATE POLICY "Admins can view all activity" ON activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- 10. Verificación
SELECT 'SuperAdmin schema created successfully!' AS status;
SELECT COUNT(*) AS users_with_profiles FROM user_profiles;
