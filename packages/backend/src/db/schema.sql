-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'reviewer')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- PROJECTS
-- =========================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'processing', 'completed')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    root_path TEXT NOT NULL, -- root path of the project
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_project_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE TABLE library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    absolute_path TEXT NOT NULL, -- folders inside project.root_path will be multiple libraries, users can also add other paths that is not under project.root_path
    project_id UUID NOT NULL, -- project that the library belongs to
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'processing', 'completed')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL, -- user that created the library
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_library_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_library_user
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
    library_id UUID NOT NULL,
    filename TEXT NOT NULL,
    absolute_path TEXT NOT NULL,
    thumbnail_path TEXT,
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
    library_id UUID NOT NULL,
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

CREATE INDEX idx_reviews_photo_decision
    ON photo_reviews(photo_id, decision);