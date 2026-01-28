-- ============================================================================
-- AIT-Authenticator Initial Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth-only users

    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),

    -- Role & Status
    role VARCHAR(50) NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'supervisor', 'agent', 'customer')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),

    -- Email Verification
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verification_expires_at TIMESTAMP,

    -- Two-Factor Authentication
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret VARCHAR(255),

    -- Password Reset
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email_verified ON users(email_verified) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================================
-- OAUTH IDENTITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- OAuth Provider Info
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'microsoft', 'github', 'apple')),
    provider_user_id VARCHAR(255) NOT NULL,

    -- Tokens
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,

    -- Profile Data
    profile_data JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Unique constraint: one OAuth account per provider per user
    UNIQUE(provider, provider_user_id)
);

-- Indexes for oauth_identities
CREATE INDEX idx_oauth_user_id ON oauth_identities(user_id);
CREATE INDEX idx_oauth_provider ON oauth_identities(provider, provider_user_id);

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session Info
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP
);

-- Indexes for sessions
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_revoked ON sessions(revoked_at) WHERE revoked_at IS NULL;

-- Auto-delete expired sessions (cleanup job will use this)
CREATE INDEX idx_sessions_cleanup ON sessions(expires_at) WHERE revoked_at IS NULL;

-- ============================================================================
-- REFRESH TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Token
    token VARCHAR(500) UNIQUE NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    used_at TIMESTAMP,

    -- Tracking
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Token family (for rotation)
    family_id UUID DEFAULT gen_random_uuid()
);

-- Indexes for refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token) WHERE revoked_at IS NULL AND used_at IS NULL;
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Action Details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),

    -- Request Info
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_id VARCHAR(100),

    -- Changes
    changes JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    -- Result
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,

    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_success ON audit_logs(success) WHERE success = false;

-- ============================================================================
-- PERMISSIONS TABLE (RBAC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Permission Details
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100),
    action VARCHAR(50),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    ('users:read', 'View users', 'users', 'read'),
    ('users:write', 'Create and update users', 'users', 'write'),
    ('users:delete', 'Delete users', 'users', 'delete'),
    ('customers:read', 'View customers', 'customers', 'read'),
    ('customers:write', 'Create and update customers', 'customers', 'write'),
    ('customers:delete', 'Delete customers', 'customers', 'delete'),
    ('policies:read', 'View policies', 'policies', 'read'),
    ('policies:write', 'Create and update policies', 'policies', 'write'),
    ('policies:delete', 'Delete policies', 'policies', 'delete'),
    ('claims:read', 'View claims', 'claims', 'read'),
    ('claims:write', 'Create and update claims', 'claims', 'write'),
    ('claims:approve', 'Approve or deny claims', 'claims', 'approve'),
    ('calls:manage', 'Manage calls', 'calls', 'manage'),
    ('reports:read', 'View reports', 'reports', 'read'),
    ('settings:write', 'Modify system settings', 'settings', 'write')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ROLE PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(role, permission_id)
);

-- Seed default role permissions
-- Admin: all permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT DO NOTHING;

-- Supervisor: most permissions except settings
INSERT INTO role_permissions (role, permission_id)
SELECT 'supervisor', id FROM permissions
WHERE name != 'settings:write' AND name != 'users:delete'
ON CONFLICT DO NOTHING;

-- Agent: limited permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'agent', id FROM permissions
WHERE name IN (
    'customers:read', 'customers:write',
    'policies:read',
    'claims:read', 'claims:write',
    'calls:manage'
)
ON CONFLICT DO NOTHING;

-- Customer: very limited
INSERT INTO role_permissions (role, permission_id)
SELECT 'customer', id FROM permissions
WHERE name IN ('policies:read', 'claims:read', 'claims:write')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_identities_updated_at
    BEFORE UPDATE ON oauth_identities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to clean up expired tokens and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_auth()
RETURNS void AS $$
BEGIN
    -- Mark expired sessions as revoked
    UPDATE sessions
    SET revoked_at = NOW()
    WHERE expires_at < NOW()
    AND revoked_at IS NULL;

    -- Mark expired refresh tokens as revoked
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE expires_at < NOW()
    AND revoked_at IS NULL;

    -- Delete old audit logs (older than 90 days)
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active users view
CREATE OR REPLACE VIEW active_users AS
SELECT
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    status,
    email_verified,
    two_factor_enabled,
    created_at,
    last_login_at
FROM users
WHERE status = 'active' AND deleted_at IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with authentication and profile information';
COMMENT ON TABLE oauth_identities IS 'OAuth provider identities linked to users';
COMMENT ON TABLE sessions IS 'Active user sessions';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for token rotation';
COMMENT ON TABLE audit_logs IS 'Audit trail of all user actions';
COMMENT ON TABLE permissions IS 'Available system permissions';
COMMENT ON TABLE role_permissions IS 'Permissions assigned to each role';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'AIT-Authenticator schema created successfully';
    RAISE NOTICE 'Tables: users, oauth_identities, sessions, refresh_tokens, audit_logs, permissions, role_permissions';
END $$;
