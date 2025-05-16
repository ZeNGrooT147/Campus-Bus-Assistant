-- Enable Row Level Security
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policy to allow coordinators to create alerts
CREATE POLICY "Coordinators can create alerts"
ON public.alerts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coordinator'
  )
);

-- Policy to allow all authenticated users to view alerts
CREATE POLICY "Authenticated users can view alerts"
ON public.alerts
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow coordinators to update alerts
CREATE POLICY "Coordinators can update alerts"
ON public.alerts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coordinator'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coordinator'
  )
);

-- Policy to allow coordinators to delete alerts
CREATE POLICY "Coordinators can delete alerts"
ON public.alerts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coordinator'
  )
); 