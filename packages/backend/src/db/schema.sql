-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Reference snapshot: Knex migrations are authoritative. Run `knex migrate:latest` on an empty database.

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
        CHECK (status IN ('active', 'processing', 'completed', 'deleted')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    root_path TEXT NOT NULL, -- root path of the project
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_project_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE project_members (
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'reviewer', 'contributor')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_project_members_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_members_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    PRIMARY KEY (project_id, user_id)
);

CREATE UNIQUE INDEX project_members_one_owner_per_project
    ON project_members (project_id)
    WHERE is_owner;

-- =========================
-- PHOTOS
-- =========================
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    original_path TEXT NOT NULL,
    original_name TEXT,
    mime_type TEXT,
    file_size BIGINT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'ready', 'failed')),
    width INTEGER,
    height INTEGER,
    preview_path TEXT,
    thumbnail_path TEXT,
    hash TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_photo_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);

CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    error_message TEXT,
    worker_id TEXT,
    queued_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    CONSTRAINT fk_processing_job_photo
        FOREIGN KEY (photo_id)
        REFERENCES photos(id)
        ON DELETE CASCADE,

    CONSTRAINT processing_jobs_job_type_check
        CHECK (job_type IN ('thumbnail', 'preview', 'metadata')),

    CONSTRAINT processing_jobs_status_check
        CHECK (status IN ('queued', 'processing', 'done', 'failed'))
);

CREATE INDEX idx_processing_jobs_status_queued ON processing_jobs(status, queued_at);

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

CREATE INDEX idx_reviews_photo_decision
    ON photo_reviews(photo_id, decision);