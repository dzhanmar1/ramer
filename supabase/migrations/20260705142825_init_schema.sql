-- Enable pgcrypto for uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT,
  kaspi_phone TEXT,
  default_markup_percent INTEGER DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Materials: Profile
CREATE TABLE public.materials_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_per_meter NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.materials_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profiles" 
ON public.materials_profile FOR ALL 
USING (auth.uid() = user_id);

-- Materials: Glass
CREATE TABLE public.materials_glass (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_per_sqm NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.materials_glass ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own glass" 
ON public.materials_glass FOR ALL 
USING (auth.uid() = user_id);

-- Materials: Hardware
CREATE TABLE public.materials_hardware (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_per_set NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.materials_hardware ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own hardware" 
ON public.materials_hardware FOR ALL 
USING (auth.uid() = user_id);

-- Orders
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_address TEXT,
  status TEXT DEFAULT 'Measurement' CHECK (status IN ('Measurement', 'Production', 'Installed', 'Paid')),
  materials_cost NUMERIC DEFAULT 0,
  applied_markup_percent INTEGER DEFAULT 40,
  final_retail_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own orders" 
ON public.orders FOR ALL 
USING (auth.uid() = user_id);

-- Order Items
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  quantity INTEGER DEFAULT 1,
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own order items" 
ON public.order_items FOR ALL 
USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);
