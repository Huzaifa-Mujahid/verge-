-- ═══════════════════════════════════════════════════════════════
-- ClientFlow CRM — Staff Management & Task Assignment Update
-- ═══════════════════════════════════════════════════════════════

-- 1. UPDATE USER ROLES
-- Add new roles to the check constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
    CHECK (role IN ('Admin', 'Manager', 'Customer Success', 'Sales Agent', 'Sales Closer', 'Employee'));

-- 2. UPDATE CLIENTS TABLE
-- Add assigned_to column to link clients to specific staff members
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON public.clients(assigned_to);

-- 3. UPDATE PROJECTS TABLE
-- Add assigned_to column to link projects to specific staff members
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON public.projects(assigned_to);

-- 4. UPDATE TASKS TABLE
-- Add assignment and duration details
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS duration text; -- e.g., '2 hours', '3 days'
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_time timestamptz;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'));

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);

-- 5. UPDATE RLS POLICIES FOR STAFF FILTERING
-- We need to make sure staff only see their own assigned data unless they are Admin/Manager

-- Clients Policies Update
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
CREATE POLICY "Staff can view assigned clients, Admin/Manager view all"
    ON public.clients FOR SELECT
    USING (
        auth.uid() = assigned_to 
        OR public.is_admin() 
        OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'Manager')
    );

-- Projects Policies Update
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
CREATE POLICY "Staff can view assigned projects, Admin/Manager view all"
    ON public.projects FOR SELECT
    USING (
        auth.uid() = assigned_to 
        OR public.is_admin() 
        OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'Manager')
    );

-- Tasks Policies Update
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.tasks;
CREATE POLICY "Staff can manage assigned tasks, Admin/Manager manage all"
    ON public.tasks FOR ALL
    USING (
        auth.uid() = assigned_to 
        OR public.is_admin() 
        OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'Manager')
    );

-- 6. STAFF PROFILES VIEW (For Admin to manage staff)
-- Create a view or just allow admins to see user_roles and join with auth.users if possible
-- Note: Supabase doesn't allow direct join with auth.users easily in RLS without service_role
-- But we can use the user_roles table which we already have.

-- Add a column for name in user_roles if we want to store it there for easier listing
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS email text;
