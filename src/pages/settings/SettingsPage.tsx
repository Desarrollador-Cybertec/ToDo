import { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { settingsApi, automationApi, importApi } from '../../api/settings';
import { ApiError } from '../../api/client';
import type { SystemSetting, MessageTemplate } from '../../types';
import { HiOutlineCog, HiOutlineMail, HiOutlineLightningBolt, HiOutlineUpload, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineInformationCircle } from 'react-icons/hi';
import { PageTransition, FadeIn, SlideDown, SkeletonCard, Badge } from '../../components/ui';

const SETTING_LABELS: Record<string, string> = {
  daily_summary_time: 'Hora del resumen diario',
  detect_overdue_time: 'Hora de detección de vencidas',
  inactivity_alert_time: 'Hora de alerta de inactividad',
  send_reminders_time: 'Hora de envío de recordatorios',
  alert_days_before_due: 'Días de anticipación para alertas',
  daily_summary_enabled: 'Resumen diario activado',
  detect_overdue_enabled: 'Detección de vencidas activada',
  emails_enabled: 'Envío de correos activado',
  inactivity_alert_days: 'Días para alerta de inactividad',
  inactivity_alert_enabled: 'Alerta de inactividad activada',
};

const GROUP_LABELS: Record<string, string> = {
  automation: 'Automatización',
  notifications: 'Notificaciones',
  general: 'General',
};

const TEMPLATE_VARIABLES = [
  { variable: '{{user_name}}', desc: 'Nombre del usuario' },
  { variable: '{{task_title}}', desc: 'Título de la tarea' },
  { variable: '{{task_status}}', desc: 'Estado de la tarea' },
  { variable: '{{task_priority}}', desc: 'Prioridad de la tarea' },
  { variable: '{{due_date}}', desc: 'Fecha límite' },
  { variable: '{{area_name}}', desc: 'Nombre del área' },
  { variable: '{{app_name}}', desc: 'Nombre de la aplicación' },
  { variable: '{{app_url}}', desc: 'URL de la aplicación' },
];

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'templates' | 'automation' | 'import'>('settings');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [templateDrafts, setTemplateDrafts] = useState<Record<number, Partial<Pick<MessageTemplate, 'subject' | 'body' | 'active'>>>>({});
  const [saving, setSaving] = useState(false);
  const [savingTemplateId, setSavingTemplateId] = useState<number | null>(null);
  const [confirmingTemplateId, setConfirmingTemplateId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const lastFocusedRef = useRef<{ templateId: number; field: 'subject' | 'body'; element: HTMLInputElement | HTMLTextAreaElement } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, templatesRes] = await Promise.all([
        settingsApi.listSettings().catch(() => []),
        settingsApi.listTemplates().catch(() => [] as MessageTemplate[]),
      ]);
      // API returns settings grouped as { group: [...] } — flatten to array
      let flatSettings: SystemSetting[];
      if (Array.isArray(settingsRes)) {
        flatSettings = settingsRes;
      } else if (settingsRes && typeof settingsRes === 'object') {
        flatSettings = Object.values(settingsRes as Record<string, SystemSetting[]>).flat();
      } else {
        flatSettings = [];
      }
      // API may return value as native types (true, 3) — normalize to string
      flatSettings = flatSettings.map((s) => ({
        ...s,
        value: String(s.value),
      }));
      setSettings(flatSettings);
      setTemplates(Array.isArray(templatesRes) ? templatesRes : []);
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

  const updateDraft = (key: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const hasPendingChanges = Object.keys(drafts).length > 0;

  const saveAllSettings = async () => {
    if (!hasPendingChanges) return;
    setConfirmAction({
      title: 'Guardar configuración',
      description: `Se modificarán ${Object.keys(drafts).length} configuración(es). ¿Deseas continuar?`,
      onConfirm: async () => {
        setConfirmAction(null);
        setSaving(true);
        try {
          const changes = Object.entries(drafts).map(([key, value]) => ({ key, value }));
          await settingsApi.updateSettings(changes);
          setDrafts({});
          showMessage('Configuración guardada');
          loadData();
        } catch (err) {
          showError(err instanceof ApiError ? err.data.message : 'Error al guardar');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const updateTemplateDraft = (id: number, changes: Partial<Pick<MessageTemplate, 'subject' | 'body' | 'active'>>) => {
    setTemplateDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...changes },
    }));
  };

  const hasPendingTemplateDrafts = Object.keys(templateDrafts).length > 0;

  const saveTemplate = async (id: number) => {
    const changes = templateDrafts[id];
    if (!changes) return;
    setSavingTemplateId(id);
    try {
      await settingsApi.updateTemplate(id, changes);
      setTemplateDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setConfirmingTemplateId(null);
      showMessage('Plantilla guardada');
      loadData();
    } catch (err) {
      showError(err instanceof ApiError ? err.data.message : 'Error al guardar plantilla');
    } finally {
      setSavingTemplateId(null);
    }
  };

  const discardTemplateDraft = (id: number) => {
    setTemplateDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setConfirmingTemplateId(null);
  };

  const saveAllTemplates = async () => {
    if (!hasPendingTemplateDrafts) return;
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(templateDrafts).map(([id, changes]) =>
          settingsApi.updateTemplate(Number(id), changes)
        )
      );
      setTemplateDrafts({});
      showMessage('Todas las plantillas guardadas');
      loadData();
    } catch (err) {
      showError(err instanceof ApiError ? err.data.message : 'Error al guardar plantillas');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string, templateId?: number, field?: 'subject' | 'body') => {
    const target = templateId != null && field
      ? { templateId, field, element: lastFocusedRef.current?.element ?? null }
      : lastFocusedRef.current;
    if (!target) return;
    const { templateId: tId, field: f } = target;
    const tpl = templates.find((t) => t.id === tId);
    if (!tpl) return;
    const draft = templateDrafts[tId];
    const currentValue = f === 'subject' ? (draft?.subject ?? tpl.subject) : (draft?.body ?? tpl.body);
    const el = target.element;
    let newValue: string;
    if (el && document.activeElement === el) {
      const start = el.selectionStart ?? currentValue.length;
      const end = el.selectionEnd ?? start;
      newValue = currentValue.slice(0, start) + variable + currentValue.slice(end);
      updateTemplateDraft(tId, { [f]: newValue });
      requestAnimationFrame(() => {
        const pos = start + variable.length;
        el.setSelectionRange(pos, pos);
        el.focus();
      });
    } else {
      newValue = currentValue + variable;
      updateTemplateDraft(tId, { [f]: newValue });
    }
  };

  const handleDrop = (e: React.DragEvent, templateId: number, field: 'subject' | 'body') => {
    e.preventDefault();
    const variable = e.dataTransfer.getData('text/plain');
    if (variable.startsWith('{{')) {
      insertVariable(variable, templateId, field);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-gray-900">{confirmAction.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{confirmAction.description}</p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmAction.onConfirm}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="space-y-4">
                {Object.entries(settingsByGroup).map(([group, groupSettings]) => (
                  <FadeIn key={group} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">{GROUP_LABELS[group.toLowerCase()] ?? group}</h3>
                    <div className="divide-y divide-gray-100">
                      {groupSettings.map((setting) => {
                        const currentValue = drafts[setting.key] ?? setting.value;
                        const isModified = setting.key in drafts;
                        return (
                          <div key={setting.id} className="flex items-center justify-between gap-3 py-2">
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm ${isModified ? 'font-semibold text-blue-700' : 'font-medium text-gray-900'}`}>{SETTING_LABELS[setting.key] ?? setting.key}</p>
                              {setting.description && <p className="text-xs text-gray-400">{setting.description}</p>}
                            </div>
                            {setting.type === 'boolean' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const newVal = currentValue === 'true' ? 'false' : 'true';
                                  updateDraft(setting.key, newVal);
                                }}
                                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all active:scale-[0.96] ${
                                  currentValue === 'true'
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {currentValue === 'true' ? 'Activo' : 'Inactivo'}
                              </button>
                            ) : (
                              <input
                                type={setting.type === 'integer' ? 'number' : 'text'}
                                value={currentValue}
                                onChange={(e) => updateDraft(setting.key, e.target.value)}
                                className={`w-40 rounded-lg border px-3 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                  isModified ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300'
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </FadeIn>
                ))}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={saveAllSettings}
                    disabled={!hasPendingChanges || saving}
                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-3">
                <FadeIn className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-700">
                    <HiOutlineInformationCircle className="h-4 w-4" /> Variables disponibles
                  </div>
                  <p className="mb-2 text-xs text-indigo-600/70">Haz clic en una variable para insertarla, o arrástrala al campo de asunto o cuerpo.</p>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_VARIABLES.map((v) => (
                      <button
                        key={v.variable}
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', v.variable);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => insertVariable(v.variable)}
                        className="group flex items-center gap-1.5 rounded-lg bg-indigo-100 px-2.5 py-1.5 text-xs transition-all hover:bg-indigo-200 hover:shadow-sm active:scale-95 cursor-grab active:cursor-grabbing"
                        title={v.desc}
                      >
                        <code className="font-mono font-semibold text-indigo-800">{v.variable}</code>
                        <span className="text-indigo-600/70">{v.desc}</span>
                      </button>
                    ))}
                  </div>
                </FadeIn>
                {templates.map((t) => {
                  const draft = templateDrafts[t.id];
                  const currentSubject = draft?.subject ?? t.subject;
                  const currentBody = draft?.body ?? t.body;
                  const currentActive = draft?.active ?? t.active;
                  const isModified = t.id in templateDrafts;
                  return (
                    <FadeIn key={t.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${isModified ? 'border-blue-200' : 'border-gray-100'}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">{t.name}</h4>
                          <span className="text-xs text-gray-400">{t.slug}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateTemplateDraft(t.id, { active: !currentActive })}
                          className="transition-all active:scale-[0.96]"
                        >
                          <Badge variant={currentActive ? 'green' : 'gray'} size="sm">{currentActive ? 'Activa' : 'Inactiva'}</Badge>
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Asunto</label>
                          <input
                            type="text"
                            value={currentSubject}
                            onChange={(e) => updateTemplateDraft(t.id, { subject: e.target.value })}
                            onFocus={(e) => { lastFocusedRef.current = { templateId: t.id, field: 'subject', element: e.target }; }}
                            onDrop={(e) => handleDrop(e, t.id, 'subject')}
                            onDragOver={handleDragOver}
                            className={`mt-0.5 w-full rounded-lg border px-3 py-1.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                              isModified && draft?.subject != null ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Cuerpo</label>
                          <textarea
                            value={currentBody}
                            onChange={(e) => updateTemplateDraft(t.id, { body: e.target.value })}
                            onFocus={(e) => { lastFocusedRef.current = { templateId: t.id, field: 'body', element: e.target }; }}
                            onDrop={(e) => handleDrop(e, t.id, 'body')}
                            onDragOver={handleDragOver}
                            rows={3}
                            className={`mt-0.5 w-full rounded-lg border px-3 py-1.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                              isModified && draft?.body != null ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300'
                            }`}
                          />
                        </div>
                      </div>
                      {isModified && (
                        <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                          {confirmingTemplateId === t.id ? (
                            <>
                              <span className="mr-auto text-xs text-amber-600">\u00bfGuardar cambios de esta plantilla?</span>
                              <button
                                type="button"
                                onClick={() => setConfirmingTemplateId(null)}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => saveTemplate(t.id)}
                                disabled={savingTemplateId === t.id}
                                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                              >
                                {savingTemplateId === t.id ? 'Guardando...' : 'Confirmar'}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => discardTemplateDraft(t.id)}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                              >
                                Descartar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingTemplateId(t.id)}
                                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
                              >
                                Guardar
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </FadeIn>
                  );
                })}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={saveAllTemplates}
                    disabled={!hasPendingTemplateDrafts || saving}
                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar todas'}
                  </button>
                </div>
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
