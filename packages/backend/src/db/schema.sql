-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'reviewer')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- PROJECTS
-- =========================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    root_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'processing', 'completed')),
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_project_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================
-- PHOTOS
-- =========================
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    filename TEXT NOT NULL,
    absolute_path TEXT NOT NULL,
    hash TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_photo_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);

-- =========================
-- PHOTO REVIEWS
-- =========================
CREATE TABLE photo_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL,
    user_id UUID NOT NULL,
    seen BOOLEAN NOT NULL DEFAULT TRUE,
    decision SMALLINT, -- NULL = seen only, 1 = selected, -1 = rejected
    renamed_to TEXT,
    seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
    voted_at TIMESTAMP,

    CONSTRAINT fk_review_photo
        FOREIGN KEY (photo_id)
        REFERENCES photos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_photo_user
        UNIQUE (photo_id, user_id)
);

-- =========================
-- INDEXES (CRITICAL FOR SCALE)
-- =========================

CREATE INDEX idx_photos_project
    ON photos(project_id);

CREATE INDEX idx_reviews_user
    ON photo_reviews(user_id);

CREATE INDEX idx_reviews_photo
    ON photo_reviews(photo_id);

CREATE INDEX idx_reviews_photo_user
    ON photo_reviews(photo_id, user_id);

CREATE INDEX idx_reviews_photo_decision
    ON photo_reviews(photo_id, decision);