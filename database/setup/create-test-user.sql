-- Create Test User with Dummy Credentials
-- Run this in Supabase SQL Editor after refreshing schema cache

-- Password: admin123
-- Hash generated with bcrypt (10 rounds)
-- You can generate your own at: https://bcrypt-generator.com/

-- Insert test admin user
INSERT INTO users (email, password_hash, name, role) 
VALUES (
  'admin@rdms.com',
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZq',  -- This is a placeholder, use real hash
  'Admin User',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Insert test regular user
INSERT INTO users (email, password_hash, name, role) 
VALUES (
  'user@rdms.com',
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZq',  -- This is a placeholder, use real hash
  'Test User',
  'user'
)
ON CONFLICT (email) DO NOTHING;

-- Note: You need to generate real bcrypt hashes for the passwords
-- Use: https://bcrypt-generator.com/ with 10 rounds

