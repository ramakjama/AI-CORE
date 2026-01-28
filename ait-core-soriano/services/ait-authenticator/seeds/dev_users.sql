-- ============================================================================
-- AIT-Authenticator Development Users Seed
-- ============================================================================
-- Password for all users: "Password123!"
-- Hash generated with bcrypt salt rounds = 12
-- ============================================================================

-- Admin User
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    role,
    status,
    email_verified,
    two_factor_enabled
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@aintech.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5/JqFB9.vtZqG',
    'Admin',
    'User',
    '+34600000001',
    'admin',
    'active',
    true,
    false
) ON CONFLICT (email) DO NOTHING;

-- Supervisor Users
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    role,
    status,
    email_verified,
    two_factor_enabled
) VALUES
(
    'a0000000-0000-0000-0000-000000000002',
    'supervisor1@aintech.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5/JqFB9.vtZqG',
    'María',
    'García',
    '+34600000002',
    'supervisor',
    'active',
    true,
    false
),
(
    'a0000000-0000-0000-0000-000000000003',
    'supervisor2@aintech.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5/JqFB9.vtZqG',
    'Carlos',
    'Rodríguez',
    '+34600000003',
    'supervisor',
    'active',
    true,
    false
)
ON CONFLICT (email) DO NOTHING;

-- Agent Users
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    role,
    status,
    email_verified,
    two_factor_enabled
) VALUES
(
    'a0000000-0000-0000-0000-000000000004',
    'agent1@aintech.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5/JqFB9.vtZqG',
    'Ana',
    'Martínez',
    '+34600000004',
    'agent',
    'active',
    true,
    false
),
(
    'a0000000-0000-0000-0000-000000000005',
    'agent2@aintech.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5/JqFB9.vtZqG',
    'Luis',
    'Fernández',
    '+34600000005',
    'agent',
    'active',
    true,
    false
),
(
    'a0000000-0000-0000-0000-000000000006',
    'agent3@aintech.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5/JqFB9.vtZqG',
    'Laura',
    'López',
    '+34600000006',
    'agent',
    'active',
    true,
    false
)
ON CONFLICT (email) DO NOTHING;

-- Customer Users
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    role,
    status,
    email_verified,
    two_factor_enabled
) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'customer1@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5/JqFB9.vtZqG',
    'Juan',
    'Pérez',
    '+34600000007',
    'customer',
    'active',
    true,
    false
),
(
    'c0000000-0000-0000-0000-000000000002',
    'customer2@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5/JqFB9.vtZqG',
    'Elena',
    'González',
    '+34600000008',
    'customer',
    'active',
    true,
    false
),
(
    'c0000000-0000-0000-0000-000000000003',
    'customer3@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5/JqFB9.vtZqG',
    'Pedro',
    'Sánchez',
    '+34600000009',
    'customer',
    'active',
    true,
    false
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- Sample Sessions (optional - for testing)
-- ============================================================================

-- Create a sample session for admin user (expires in 24 hours)
INSERT INTO sessions (
    id,
    user_id,
    ip_address,
    user_agent,
    expires_at,
    last_activity_at
) VALUES (
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    '127.0.0.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    NOW() + INTERVAL '24 hours',
    NOW()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- Sample OAuth Identities (optional - for testing)
-- ============================================================================

-- Link admin to a sample Google account
INSERT INTO oauth_identities (
    id,
    user_id,
    provider,
    provider_user_id,
    profile_data
) VALUES (
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'google',
    'google_admin_123456',
    '{"email": "admin@aintech.com", "name": "Admin User"}'::jsonb
) ON CONFLICT (provider, provider_user_id) DO NOTHING;

-- ============================================================================
-- Audit Log Sample
-- ============================================================================

INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    ip_address,
    success
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'login',
    'auth',
    '127.0.0.1',
    true
);

-- ============================================================================
-- Completion Message
-- ============================================================================

DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    RAISE NOTICE '================================================';
    RAISE NOTICE 'AIT-Authenticator seed data loaded successfully';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Total users created: %', user_count;
    RAISE NOTICE '';
    RAISE NOTICE 'TEST CREDENTIALS:';
    RAISE NOTICE '------------------------------------------------';
    RAISE NOTICE 'Admin:      admin@aintech.com / Password123!';
    RAISE NOTICE 'Supervisor: supervisor1@aintech.com / Password123!';
    RAISE NOTICE 'Supervisor: supervisor2@aintech.com / Password123!';
    RAISE NOTICE 'Agent:      agent1@aintech.com / Password123!';
    RAISE NOTICE 'Agent:      agent2@aintech.com / Password123!';
    RAISE NOTICE 'Agent:      agent3@aintech.com / Password123!';
    RAISE NOTICE 'Customer:   customer1@example.com / Password123!';
    RAISE NOTICE 'Customer:   customer2@example.com / Password123!';
    RAISE NOTICE 'Customer:   customer3@example.com / Password123!';
    RAISE NOTICE '================================================';
END $$;
