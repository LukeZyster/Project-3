-- =====================================================================
-- QUERIES USED BY THE LOGIN FLOW
-- Each query is labelled with the Test Case ID it supports, so it can
-- be referenced directly from the Testing Evidence document.
-- =====================================================================

-- TC-01 / TC-05: look up the account by email, to compare the
-- submitted password's hash against password_hash in the app layer.
-- (Never compare plain-text passwords in SQL — hash first, then compare.)
SELECT user_id, full_name, email, password_hash, role, status, failed_attempts, locked_until
FROM users
WHERE email = :email;

-- TC-01 (unique email rule, enforced at registration time):
-- the UNIQUE constraint on `email` in schema_users.sql makes this fail
-- with a constraint-violation error if the email is already taken.
INSERT INTO users (full_name, email, password_hash, role, status)
VALUES (:fullName, :email, :passwordHash, 'STUDENT', 'ACTIVE');

-- TC-09: block login for a suspended or banned account.
SELECT status FROM users WHERE email = :email;
-- application layer: if status <> 'ACTIVE' -> reject before checking the password

-- TC-05 / TC-10: increment the failed-attempt counter on a wrong password,
-- and lock the account once MAX_ATTEMPTS is reached.
UPDATE users
SET failed_attempts = failed_attempts + 1,
    locked_until = CASE
        WHEN failed_attempts + 1 >= 3 THEN DATEADD('MINUTE', 15, CURRENT_TIMESTAMP)
        ELSE locked_until
    END
WHERE email = :email;

-- On a successful login: reset the counter.
UPDATE users
SET failed_attempts = 0, locked_until = NULL
WHERE email = :email;

-- TC-10: check lockout status before attempting authentication at all.
SELECT locked_until FROM users WHERE email = :email;
-- application layer: if locked_until IS NOT NULL AND locked_until > NOW() -> reject
