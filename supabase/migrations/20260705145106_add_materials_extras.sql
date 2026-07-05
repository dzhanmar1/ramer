-- Materials: Extras (Sills, Ebbs, Mosquito nets, Slopes)
CREATE TABLE public.materials_extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sill', 'ebb', 'mosquito', 'slope')),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('m', 'sqm', 'pcs')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.materials_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own extras" 
ON public.materials_extras FOR ALL 
USING (auth.uid() = user_id);
