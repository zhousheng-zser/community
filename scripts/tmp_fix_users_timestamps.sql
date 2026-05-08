ALTER TABLE Users
  ADD COLUMN IF NOT EXISTS created_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL;

UPDATE Users
SET
  created_at = IFNULL(created_at, createdAt),
  updated_at = IFNULL(updated_at, updatedAt);
