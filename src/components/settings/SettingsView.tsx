import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useI18nStore } from '../../store/i18nStore';

export const SettingsView = () => {
  const navigate = useNavigate();
  const t = useI18nStore(state => state.t);
  const [profile, setProfile] = useState<{ default_markup_percent: number; kaspi_phone: string }>({ default_markup_percent: 40, kaspi_phone: '' });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [glass, setGlass] = useState<any[]>([]);
  const [hardware, setHardware] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  
  // New item states
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemType, setNewItemType] = useState('sill');
  const [newItemUnit, setNewItemUnit] = useState('m');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [
      { data: profData },
      { data: pData },
      { data: gData },
      { data: hData },
      { data: eData }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('materials_profile').select('*'),
      supabase.from('materials_glass').select('*'),
      supabase.from('materials_hardware').select('*'),
      supabase.from('materials_extras').select('*')
    ]);

    if (profData) setProfile(profData);
    if (pData) setProfiles(pData);
    if (gData) setGlass(gData);
    if (hData) setHardware(hData);
    if (eData) setExtras(eData);
  };

  const updateProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({
      default_markup_percent: profile.default_markup_percent,
      kaspi_phone: profile.kaspi_phone
    }).eq('id', user.id);
    alert(t('app.saved'));
  };

  const addItem = async (table: string, additionalData = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const priceField = table === 'materials_profile' ? 'price_per_meter' :
                       table === 'materials_glass' ? 'price_per_sqm' :
                       table === 'materials_hardware' ? 'price_per_set' : 'price';

    await supabase.from(table).insert({
      user_id: user.id,
      name: newItemName,
      [priceField]: Number(newItemPrice),
      ...additionalData
    });
    
    setNewItemName('');
    setNewItemPrice('');
    loadSettings();
  };

  const deleteItem = async (table: string, id: string) => {
    await supabase.from(table).delete().eq('id', id);
    loadSettings();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800">{t('settings.title')}</h1>
          <Button variant="outline" onClick={() => navigate('/')}>{t('settings.back_to_crm')}</Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
            <TabsTrigger value="general">{t('settings.tab.general')}</TabsTrigger>
            <TabsTrigger value="profiles">{t('settings.tab.profiles')}</TabsTrigger>
            <TabsTrigger value="glass">{t('settings.tab.glass')}</TabsTrigger>
            <TabsTrigger value="hardware">{t('settings.tab.hardware')}</TabsTrigger>
            <TabsTrigger value="extras">{t('settings.tab.extras')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader><CardTitle>{t('settings.tab.general')}</CardTitle></CardHeader>
              <CardContent className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <Label>{t('settings.general.markup')}</Label>
                  <Input type="number" value={profile.default_markup_percent} onChange={e => setProfile({...profile, default_markup_percent: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.general.kaspi')}</Label>
                  <Input type="text" placeholder="+7 700 000 00 00" value={profile.kaspi_phone || ''} onChange={e => setProfile({...profile, kaspi_phone: e.target.value})} />
                </div>
                <Button onClick={updateProfile}>{t('app.save')}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles">
            <Card>
              <CardHeader><CardTitle>{t('settings.profiles.title')}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input placeholder={t('settings.profiles.name')} value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                  <Input type="number" placeholder={t('settings.profiles.price')} value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
                  <Button onClick={() => addItem('materials_profile')}>{t('app.add')}</Button>
                </div>
                <div className="space-y-2">
                  {profiles.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-white border rounded">
                      <span>{p.name}</span>
                      <div className="flex gap-4 items-center">
                        <span className="font-bold">{p.price_per_meter} ₸</span>
                        <Button variant="destructive" size="sm" onClick={() => deleteItem('materials_profile', p.id)}>{t('app.delete')}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Glass Tab */}
          <TabsContent value="glass">
            <Card>
              <CardHeader><CardTitle>{t('settings.glass.title')}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input placeholder={t('settings.glass.name')} value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                  <Input type="number" placeholder={t('settings.glass.price')} value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
                  <Button onClick={() => addItem('materials_glass')}>{t('app.add')}</Button>
                </div>
                <div className="space-y-2">
                  {glass.map(g => (
                    <div key={g.id} className="flex justify-between items-center p-3 bg-white border rounded">
                      <span>{g.name}</span>
                      <div className="flex gap-4 items-center">
                        <span className="font-bold">{g.price_per_sqm} ₸</span>
                        <Button variant="destructive" size="sm" onClick={() => deleteItem('materials_glass', g.id)}>{t('app.delete')}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hardware Tab */}
          <TabsContent value="hardware">
            <Card>
              <CardHeader><CardTitle>{t('settings.hardware.title')}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input placeholder={t('settings.hardware.name')} value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                  <Input type="number" placeholder={t('settings.hardware.price')} value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
                  <Button onClick={() => addItem('materials_hardware')}>{t('app.add')}</Button>
                </div>
                <div className="space-y-2">
                  {hardware.map(h => (
                    <div key={h.id} className="flex justify-between items-center p-3 bg-white border rounded">
                      <span>{h.name}</span>
                      <div className="flex gap-4 items-center">
                        <span className="font-bold">{h.price_per_set} ₸</span>
                        <Button variant="destructive" size="sm" onClick={() => deleteItem('materials_hardware', h.id)}>{t('app.delete')}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Extras Tab */}
          <TabsContent value="extras">
            <Card>
              <CardHeader><CardTitle>{t('settings.extras.title')}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <select className="border rounded p-2" value={newItemType} onChange={e => setNewItemType(e.target.value)}>
                    <option value="sill">{t('settings.extras.type.sill')}</option>
                    <option value="ebb">{t('settings.extras.type.ebb')}</option>
                    <option value="mosquito">{t('settings.extras.type.mosquito')}</option>
                    <option value="slope">{t('settings.extras.type.slope')}</option>
                  </select>
                  <Input placeholder={t('settings.extras.name')} value={newItemName} onChange={e => setNewItemName(e.target.value)} className="col-span-2" />
                  <Input type="number" placeholder={t('settings.extras.price')} value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
                  <select className="border rounded p-2" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}>
                    <option value="m">{t('settings.extras.unit.m')}</option>
                    <option value="sqm">{t('settings.extras.unit.sqm')}</option>
                    <option value="pcs">{t('settings.extras.unit.pcs')}</option>
                  </select>
                </div>
                <Button className="mb-6 w-full" onClick={() => addItem('materials_extras', { type: newItemType, unit: newItemUnit })}>{t('app.add')}</Button>

                <div className="space-y-2">
                  {extras.map(e => (
                    <div key={e.id} className="flex justify-between items-center p-3 bg-white border rounded">
                      <div>
                        <span className="font-bold mr-2 text-blue-600">
                          {e.type === 'sill' ? t('settings.extras.type.sill') : e.type === 'ebb' ? t('settings.extras.type.ebb') : e.type === 'mosquito' ? t('settings.extras.type.mosquito') : t('settings.extras.type.slope')}
                        </span>
                        <span>{e.name}</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <span className="font-bold">{e.price} ₸ / {e.unit === 'm' ? t('settings.extras.unit.m') : e.unit === 'sqm' ? t('settings.extras.unit.sqm') : t('settings.extras.unit.pcs')}</span>
                        <Button variant="destructive" size="sm" onClick={() => deleteItem('materials_extras', e.id)}>{t('app.delete')}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
