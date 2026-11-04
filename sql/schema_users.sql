-- =====================================================================
-- USERS TABLE — Student Marketplace
-- Matches the User entity from the Term 2 ERD and the login business
-- rules (unique email, encrypted password, required role, active flag).
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
    user_id         INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(120)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,          -- "unique email address" rule
    password_hash   VARCHAR(255)  NOT NULL,                 -- store a bcrypt/argon2 hash, never plain text
    role            VARCHAR(20)   NOT NULL DEFAULT 'STUDENT' -- 'STUDENT' or 'ADMIN', set at creation
                    CHECK (role IN ('STUDENT', 'ADMIN')),
    status          VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE'  -- 'ACTIVE', 'SUSPENDED', 'BANNED'
                    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'BANNED')),
    bio             VARCHAR(500),
    profile_picture VARCHAR(255),
    phone_num       VARCHAR(20),
    failed_attempts INT           NOT NULL DEFAULT 0,        -- supports the lockout rule (TC-10)
    locked_until    DATETIME      NULL,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sample seed data for manual/testing evidence use (passwords shown here
-- are placeholders only — real rows must store a hashed password).
INSERT INTO users (full_name, email, password_hash, role, status)
VALUES
    ('Rocco Visagie', 'rocco@campus.edu',      '$2a$10$examplehash...', 'STUDENT', 'ACTIVE'),
    ('Suspended Test', 'suspended@campus.edu', '$2a$10$examplehash...', 'STUDENT', 'SUSPENDED');
