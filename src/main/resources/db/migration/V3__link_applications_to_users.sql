ALTER TABLE applications
    ADD COLUMN user_id BIGINT;

UPDATE applications
SET user_id = (
    SELECT id
    FROM users
    ORDER BY id
    LIMIT 1
    )
WHERE user_id IS NULL;

ALTER TABLE applications
    ALTER COLUMN user_id SET NOT NULL,
    ADD CONSTRAINT fk_applications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id);

CREATE INDEX idx_applications_user_id
    ON applications(user_id);