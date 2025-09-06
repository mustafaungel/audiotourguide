-- Create missing profile for the admin user
INSERT INTO public.profiles (user_id, email, full_name, role) 
VALUES (
  'acb3694c-6502-4cb4-b07d-233c1b331689', 
  'mustafa.ungel@gmail.com', 
  'Mustafa Admin', 
  'admin'
);