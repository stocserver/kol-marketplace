-- Add admin user type to profiles table

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Add the new constraint that includes 'admin'
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
  CHECK (user_type IN ('kol', 'sponsor', 'admin'));

-- Optionally, you can update a specific user to be admin
-- Replace 'your-email@example.com' with your actual email
-- UPDATE profiles SET user_type = 'admin' 
-- WHERE email = 'your-email@example.com';