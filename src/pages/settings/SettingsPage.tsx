import { useEffect, useState, useCallback } from 'react';
import { settingsApi, automationApi, importApi } from '../../api/settings';
import { ApiError } from '../../api/client';
import type { SystemSetting, MessageTemplate } from '../../types';
import { HiOutlineCog, HiOutlineMail, HiOutlineLightningBolt, HiOutlineUpload } from 'react-icons/hi';

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
        settingsApi.listSettings().catch(() => ({ data: [] as SystemSetting[] })),
        settingsApi.listTemplates().catch(() => ({ data: [] as MessageTemplate[] })),
      ]);
      setSettings(settingsRes.data);
      setTemplates(templatesRes.data);
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

  const updateSetting = async (id: number, value: string) => {
    try {
      await settingsApi.updateSetting(id, { value });
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

  // Group settings by group
  const settingsByGroup = settings.reduce<Record<string, SystemSetting[]>>((acc, s) => {
    const group = s.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {});

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Configuración del Sistema</h2>

      {message && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">{message}</div>}
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="mb-6 flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      ) : (
        <>
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {Object.entries(settingsByGroup).map(([group, groupSettings]) => (
                <div key={group} className="rounded-xl border bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">{group}</h3>
                  <div className="space-y-4">
                    {groupSettings.map((setting) => (
                      <div key={setting.id} className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{setting.key}</p>
                          {setting.description && <p className="text-xs text-gray-500">{setting.description}</p>}
                        </div>
                        {setting.type === 'boolean' ? (
                          <button
                            type="button"
                            onClick={() => updateSetting(setting.id, setting.value === 'true' ? 'false' : 'true')}
                            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
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
                                updateSetting(setting.id, e.target.value);
                              }
                            }}
                            className="w-48 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-3">
              {templates.map((t) => (
                <div key={t.id} className="rounded-xl border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{t.name}</h4>
                      <p className="text-xs text-gray-500">Slug: {t.slug}</p>
                      <p className="mt-1 text-sm text-gray-600">Asunto: {t.subject}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleTemplate(t)}
                      className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                        t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {t.active ? 'Activa' : 'Inactiva'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'automation' && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Ejecutar procesos manualmente</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => runAutomation('Detección de vencidas', automationApi.detectOverdue)}
                  className="rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">Detectar tareas vencidas</p>
                  <p className="text-xs text-gray-500">Marca como vencidas las tareas pasadas de fecha</p>
                </button>
                <button
                  type="button"
                  onClick={() => runAutomation('Resumen diario', automationApi.sendDailySummary)}
                  className="rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">Enviar resumen diario</p>
                  <p className="text-xs text-gray-500">Genera resúmenes consolidados por responsable</p>
                </button>
                <button
                  type="button"
                  onClick={() => runAutomation('Recordatorios', automationApi.sendDueReminders)}
                  className="rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">Enviar recordatorios</p>
                  <p className="text-xs text-gray-500">Envía recordatorios de tareas próximas a vencer</p>
                </button>
                <button
                  type="button"
                  onClick={() => runAutomation('Detección de inactividad', automationApi.detectInactive)}
                  className="rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">Detectar inactividad</p>
                  <p className="text-xs text-gray-500">Detecta tareas sin avance y envía alertas</p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Importar tareas desde CSV</h3>
              <p className="mb-4 text-sm text-gray-600">
                Sube un archivo CSV con columnas: titulo, descripcion, responsable_email, area, prioridad, estado, fecha_inicio, fecha_limite.
              </p>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="text-sm text-gray-600"
                />
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!importFile}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Importar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
