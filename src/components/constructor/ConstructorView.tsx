import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CommercialOfferPDF } from '../pdf/CommercialOfferPDF';
import { WindowCanvas } from './WindowCanvas';
import { useWindowStore } from '../../store/windowStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { calculateWindow } from '../../lib/pricingEngine';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { usePricingStore } from '../../store/pricingStore';
import { useI18nStore } from '../../store/i18nStore';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const ConstructorView = () => {
  const navigate = useNavigate();
  const { config, currentOrderId, clientName: initialClientName, clientPhone: initialClientPhone, updateWidth, updateHeight, updateExtras, updateProfileId, updateGlassId } = useWindowStore();
  const { profiles, glass, selectedProfileId: globalProfileId, selectedGlassId: globalGlassId } = usePricingStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clientName, setClientName] = useState(initialClientName);
  const [clientPhone, setClientPhone] = useState(initialClientPhone);
  const [isSaving, setIsSaving] = useState(false);
  const t = useI18nStore(state => state.t);
  
  // Kaspi phone for PDF
  const kaspiPhone = usePricingStore(state => state.kaspiPhone) || '+7 (700) 000-00-00';


  const calc = calculateWindow(config);

  const handleSaveOrder = async () => {
    if (!clientName) return alert('Введите имя клиента');
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (currentOrderId) {
      // Update existing order
      await supabase.from('orders').update({
        client_name: clientName,
        client_phone: clientPhone,
        materials_cost: calc.materialsCost,
        final_retail_price: calc.retailPrice
      }).eq('id', currentOrderId);

      await supabase.from('order_items').update({
        config: config as any,
        price: calc.retailPrice
      }).eq('order_id', currentOrderId);

      alert(t('app.saved') || 'Заказ обновлен!');
      navigate('/');
    } else {
      // Insert new order
      const { data: order } = await supabase.from('orders').insert({
        user_id: user.id,
        client_name: clientName,
        client_phone: clientPhone,
        materials_cost: calc.materialsCost,
        final_retail_price: calc.retailPrice
      }).select().single();

      if (order) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          config: config as any,
          price: calc.retailPrice
        });
        alert(t('app.saved') || 'Заказ сохранен!');
        navigate('/');
      }
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50">
      {/* Canvas Area */}
      <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center relative bg-white">
        <h1 className="absolute top-4 left-4 text-2xl font-bold tracking-tight text-slate-800">
          {t('calc.title')}
        </h1>
        <WindowCanvas selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      {/* Sidebar Controls (Desktop) or Bottom Sheet Trigger */}
      <div className="w-full md:w-96 bg-white border-l p-6 shadow-xl flex flex-col overflow-y-auto">
        <Tabs defaultValue="dimensions" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="dimensions">{t('calc.tab.dimensions')}</TabsTrigger>
            <TabsTrigger value="extras">{t('calc.tab.extras')}</TabsTrigger>
            <TabsTrigger value="pricing">{t('calc.tab.pricing')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dimensions" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('calc.width')}</Label>
                <Input 
                  type="number" 
                  inputMode="numeric" 
                  value={config.width} 
                  onChange={e => updateWidth(Number(e.target.value))} 
                />
              </div>
              <div className="space-y-2">
                <Label>{t('calc.height')}</Label>
                <Input 
                  type="number" 
                  inputMode="numeric" 
                  value={config.height} 
                  onChange={e => updateHeight(Number(e.target.value))} 
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-200">
              {t('calc.hint')}
            </div>
          </TabsContent>

          <TabsContent value="extras" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('calc.extras.sill')}</Label>
                <Input 
                  type="number" 
                  value={config.extras?.sillLength || 0} 
                  onChange={e => updateExtras({ sillLength: Number(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <Label>{t('calc.extras.ebb')}</Label>
                <Input 
                  type="number" 
                  value={config.extras?.ebbLength || 0} 
                  onChange={e => updateExtras({ ebbLength: Number(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <Label>{t('calc.extras.mosquito')}</Label>
                <Input 
                  type="number" 
                  value={config.extras?.mosquitoCount || 0} 
                  onChange={e => updateExtras({ mosquitoCount: Number(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <Label>{t('calc.extras.slope')}</Label>
                <Input 
                  type="number" 
                  value={config.extras?.slopesLength || 0} 
                  onChange={e => updateExtras({ slopesLength: Number(e.target.value) })} 
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4 mt-4">
            
            <div className="space-y-4 bg-slate-100 p-4 rounded-lg border">
              <div className="space-y-2">
                <Label>{t('calc.pricing.select_profile')}</Label>
                <select 
                  className="w-full border rounded p-2"
                  value={config.profileId || globalProfileId || ''}
                  onChange={(e) => updateProfileId(e.target.value)}
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>{t('calc.pricing.select_glass')}</Label>
                <select 
                  className="w-full border rounded p-2"
                  value={config.glassId || globalGlassId || ''}
                  onChange={(e) => updateGlassId(e.target.value)}
                >
                  {glass.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-slate-700">{t('calc.pricing.spec')}</h3>
              <div className="text-sm space-y-1 text-slate-600">
                <p>{t('calc.pricing.profile')} {calc.profileLength.toFixed(2)} м.</p>
                <p>{t('calc.pricing.glass')} {calc.glassArea.toFixed(2)} м²</p>
                <p>{t('calc.pricing.sash')} {calc.sashCount} шт.</p>
              </div>
            </div>
            
            <div className="pt-4 border-t space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>{t('calc.pricing.cost')}</span>
                <span>{calc.materialsCost.toLocaleString('ru-RU')} ₸</span>
              </div>
              <div className="flex justify-between font-bold text-2xl text-slate-800">
                <span>{t('calc.pricing.total')}</span>
                <span>{calc.retailPrice.toLocaleString('ru-RU')} ₸</span>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-2 p-4 bg-slate-100 rounded-lg border">
                <Label>{t('calc.pricing.client_data')}</Label>
                <Input placeholder={t('calc.pricing.client_name')} value={clientName} onChange={e => setClientName(e.target.value)} />
                <Input placeholder={t('calc.pricing.client_phone')} value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                <Button className="w-full" variant="secondary" onClick={handleSaveOrder} disabled={isSaving}>
                  {isSaving ? t('calc.pricing.btn_saving') : t('calc.pricing.btn_save')}
                </Button>
              </div>

              <PDFDownloadLink 
                document={<CommercialOfferPDF config={config} calc={calc} kaspiPhone={kaspiPhone} />} 
                fileName={`KP-${Date.now()}.pdf`}
              >
                {/* @ts-ignore */}
                {({ loading }) => (
                  <Button className="w-full" size="lg" disabled={loading}>
                    {loading ? t('calc.pricing.btn_pdf_loading') : t('calc.pricing.btn_pdf')}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
