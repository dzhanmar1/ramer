import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { useWindowStore } from '../../store/windowStore';
import { usePricingStore } from '../../store/pricingStore';
import { useI18nStore } from '../../store/i18nStore';
import { useEffect, useState } from 'react';

export const DashboardView = () => {
  const navigate = useNavigate();
  const loadOrder = useWindowStore(state => state.loadOrder);
  const resetConfig = useWindowStore(state => state.resetConfig);
  const loadFromSupabase = usePricingStore(state => state.loadFromSupabase);
  const { lang, setLang, t } = useI18nStore();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadFromSupabase();
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('orders').select('*, order_items(config)').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const startNewCalculation = () => {
    resetConfig();
    navigate('/calc');
  };

  const handleEditOrder = async (order: any) => {
    const config = order.order_items?.[0]?.config;
    if (config) {
      loadOrder(order.id, order.client_name, order.client_phone || '', config);
      navigate('/calc');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm(t('app.confirm_delete') || 'Удалить заказ?')) {
      await supabase.from('orders').delete().eq('id', id);
      fetchOrders();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800">{t('dash.title')}</h1>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setLang(lang === 'ru' ? 'kk' : 'ru')}>
              {lang === 'ru' ? 'KK' : 'RU'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/settings')}>{t('app.settings')}</Button>
            <Button variant="outline" onClick={handleLogout}>{t('app.logout')}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-3 border-dashed border-2 bg-slate-50 hover:bg-slate-100 cursor-pointer" onClick={startNewCalculation}>
            <CardContent className="flex flex-col items-center justify-center p-12 text-slate-500 hover:text-slate-700">
              <span className="text-4xl mb-2">+</span>
              <span className="text-lg font-medium">{t('dash.order')} +</span>
            </CardContent>
          </Card>

          {orders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle className="text-lg">{t('dash.order')} {new Date(order.created_at).toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{order.client_name}</p>
                    <p className="text-sm text-slate-500 mb-4">{order.client_phone}</p>
                  </div>
                  {order.order_items?.[0]?.config && (
                    <div className="text-right">
                      <p className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">
                        {order.order_items[0].config.width} x {order.order_items[0].config.height} мм
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-2">
                  <select 
                    className="border rounded p-1 text-sm bg-white"
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  >
                    <option value="Measurement">{t('dash.status.measurement')}</option>
                    <option value="Production">{t('dash.status.production')}</option>
                    <option value="Installed">{t('dash.status.installed')}</option>
                    <option value="Paid">{t('dash.status.paid')}</option>
                  </select>
                  <span className="font-bold text-lg">{order.final_retail_price.toLocaleString('ru-RU')} ₸</span>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => handleEditOrder(order)}>
                    {t('app.edit') || 'Редактировать'}
                  </Button>
                  <Button variant="destructive" onClick={() => handleDeleteOrder(order.id)}>
                    {t('app.delete') || 'Удалить'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
