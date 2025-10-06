-- Add status enum type for guest reviews
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

-- Add status column to guest_reviews
ALTER TABLE guest_reviews 
ADD COLUMN status review_status DEFAULT 'pending';

-- Migrate existing data based on is_approved field
UPDATE guest_reviews 
SET status = CASE 
  WHEN is_approved = true THEN 'approved'::review_status
  ELSE 'pending'::review_status
END;

-- Make status column not null after migration
ALTER TABLE guest_reviews 
ALTER COLUMN status SET NOT NULL;

-- Drop old RLS policy that uses is_approved
DROP POLICY IF EXISTS "Approved guest reviews are viewable by everyone" ON guest_reviews;

-- Create new RLS policy using status
CREATE POLICY "Approved guest reviews are viewable by everyone"
ON guest_reviews FOR SELECT
USING (status = 'approved'::review_status);