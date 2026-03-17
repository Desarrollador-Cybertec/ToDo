import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { settingsApi, automationApi, importApi } from '../../api/settings';
import { ApiError } from '../../api/client';
import type { SystemSetting, MessageTemplate } from '../../types';
import { HiOutlineCog, HiOutlineMail, HiOutlineLightningBolt, HiOutlineUpload, HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi';
import { PageTransition, FadeIn, SlideDown, SkeletonCard, Badge } from '../../components/ui';

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'templates' | 'automation' | 'import'>('settings');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, templatesRes] = await Promise.all([
        settingsApi.listSettings().catch(() => [] as SystemSetting[]),
        settingsApi.listTemplates().catch(() => [] as MessageTemplate[]),
      ]);
      setSettings(settingsRes);
      setTemplates(templatesRes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setError('');
    setTimeout(() => setMessage(''), 3000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setMessage('');
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await settingsApi.updateSettings([{ key, value }]);
      showMessage('Configuración actualizada');
      loadData();
    } catch (err) {
      showError(err instanceof ApiError ? err.data.message : 'Error al actualizar');
    }
  };

  const toggleTemplate = async (template: MessageTemplate) => {
    try {
      await settingsApi.updateTemplate(template.id, { active: !template.active });
      showMessage(`Plantilla ${template.active ? 'desactivada' : 'activada'}`);
      loadData();
    } catch (err) {
      showError(err instanceof ApiError ? err.data.message : 'Error al actualizar');
    }
  };

  const runAutomation = async (name: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      showMessage(`${name} ejecutado exitosamente`);
    } catch (err) {
      showError(err instanceof ApiError ? err.data.message : `Error al ejecutar ${name}`);
    }
  };

  const [importFile, setImportFile] = useState<File | null>(null);
  const handleImport = async () => {
    if (!importFile) return;
    try {
      await importApi.importTasks(importFile);
      showMessage('Importación completada exitosamente');
      setImportFile(null);
    } catch (err) {
      showError(err instanceof ApiError ? err.data.message : 'Error en la importación');
    }
  };

  const tabs = [
    { key: 'settings' as const, label: 'Configuración', icon: <HiOutlineCog className="h-4 w-4" /> },
    { key: 'templates' as const, label: 'Plantillas', icon: <HiOutlineMail className="h-4 w-4" /> },
    { key: 'automation' as const, label: 'Automatización', icon: <HiOutlineLightningBolt className="h-4 w-4" /> },
    { key: 'import' as const, label: 'Importar', icon: <HiOutlineUpload className="h-4 w-4" /> },
  ];

  const settingsByGroup = settings.reduce<Record<string, SystemSetting[]>>((acc, s) => {
    const group = s.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {});

  return (
    <PageTransition>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Configuración del Sistema</h2>

      <AnimatePresence>
        {message && (
          <SlideDown>
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-600 ring-1 ring-inset ring-green-200">
              <HiOutlineCheckCircle className="h-4 w-4 shrink-0" /> {message}
            </div>
          </SlideDown>
        )}
        {error && (
          <SlideDown>
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
              <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          </SlideDown>
        )}
      </AnimatePresence>

      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="settings-tab"
                className="absolute inset-0 rounded-lg bg-white shadow-sm"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">{tab.icon} {tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {Object.entries(settingsByGroup).map(([group, groupSettings]) => (
                  <FadeIn key={group} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">{group}</h3>
                    <div className="space-y-4">
                      {groupSettings.map((setting) => (
                        <div key={setting.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{setting.key}</p>
                            {setting.description && <p className="text-xs text-gray-500">{setting.description}</p>}
                          </div>
                          {setting.type === 'boolean' ? (
                            <button
                              type="button"
                              onClick={() => updateSetting(setting.key, setting.value === 'true' ? 'false' : 'true')}
                              className={`rounded-xl px-4 py-1.5 text-xs font-medium transition-all active:scale-[0.96] ${
                                setting.value === 'true'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {setting.value === 'true' ? 'Activo' : 'Inactivo'}
                            </button>
                          ) : (
                            <input
                              type={setting.type === 'integer' ? 'number' : 'text'}
                              defaultValue={setting.value}
                              onBlur={(e) => {
                                if (e.target.value !== setting.value) {
                                  updateSetting(setting.key, e.target.value);
                                }
                              }}
                              className="w-48 rounded-xl border border-gray-300 px-3 py-1.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </FadeIn>
                ))}
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-3">
                {templates.map((t) => (
                  <FadeIn key={t.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{t.name}</h4>
                        <p className="text-xs text-gray-400">Slug: {t.slug}</p>
                        <p className="mt-1 text-sm text-gray-600">Asunto: {t.subject}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleTemplate(t)}
                        className="transition-all active:scale-[0.96]"
                      >
                        <Badge variant={t.active ? 'green' : 'gray'} size="md">{t.active ? 'Activa' : 'Inactiva'}</Badge>
                      </button>
                    </div>
                  </FadeIn>
                ))}
              </div>
            )}

            {activeTab === 'automation' && (
              <FadeIn className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Ejecutar procesos manualmente</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { name: 'Detección de vencidas', fn: automationApi.detectOverdue, desc: 'Marca como vencidas las tareas pasadas de fecha', icon: '⏰' },
                    { name: 'Resumen diario', fn: automationApi.sendDailySummary, desc: 'Genera resúmenes consolidados por responsable', icon: '📊' },
                    { name: 'Recordatorios', fn: automationApi.sendDueReminders, desc: 'Envía recordatorios de tareas próximas a vencer', icon: '🔔' },
                    { name: 'Detección de inactividad', fn: automationApi.detectInactive, desc: 'Detecta tareas sin avance y envía alertas', icon: '⚠️' },
                  ].map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => runAutomation(item.name, item.fn)}
                      className="rounded-xl border border-gray-100 px-4 py-4 text-left text-sm transition-all hover:border-blue-100 hover:bg-blue-50/30 active:scale-[0.98]"
                    >
                      <p className="flex items-center gap-2 font-medium text-gray-900"><span>{item.icon}</span> {item.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </FadeIn>
            )}

            {activeTab === 'import' && (
              <FadeIn className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Importar tareas desde CSV</h3>
                <p className="mb-4 text-sm text-gray-600">
                  Sube un archivo CSV con columnas: titulo, descripcion, responsable_email, area, prioridad, estado, fecha_inicio, fecha_limite.
                </p>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-600 hover:file:bg-blue-100"
                  />
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!importFile}
                    className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                  >
                    Importar
                  </button>
                </div>
              </FadeIn>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </PageTransition>
  );
}
