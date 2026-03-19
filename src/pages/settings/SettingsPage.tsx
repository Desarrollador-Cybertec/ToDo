import { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { settingsApi, automationApi, importApi } from '../../api/settings';
import { ApiError } from '../../api/client';
import type { SystemSetting, MessageTemplate } from '../../types';
import { HiOutlineCog, HiOutlineMail, HiOutlineLightningBolt, HiOutlineUpload, HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi';
import { PageTransition, FadeIn, SlideDown, SkeletonCard } from '../../components/ui';
import { SettingsTab } from './components/SettingsTab';
import { TemplatesTab } from './components/TemplatesTab';

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

  const MAX_IMPORT_SIZE = 5 * 1024 * 1024; // 5 MB
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileError, setImportFileError] = useState('');

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (ext !== 'csv') { setImportFileError('Solo se permiten archivos .csv'); setImportFile(null); return; }
      if (file.size > MAX_IMPORT_SIZE) { setImportFileError(`El archivo excede el límite de ${MAX_IMPORT_SIZE / 1024 / 1024} MB.`); setImportFile(null); return; }
    }
    setImportFileError('');
    setImportFile(file);
  };

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
              <SettingsTab
                settings={settings}
                drafts={drafts}
                updateDraft={updateDraft}
                hasPendingChanges={hasPendingChanges}
                saving={saving}
                onSave={saveAllSettings}
              />
            )}

            {activeTab === 'templates' && (
              <TemplatesTab
                templates={templates}
                templateDrafts={templateDrafts}
                updateTemplateDraft={updateTemplateDraft}
                hasPendingTemplateDrafts={hasPendingTemplateDrafts}
                saving={saving}
                savingTemplateId={savingTemplateId}
                confirmingTemplateId={confirmingTemplateId}
                setConfirmingTemplateId={setConfirmingTemplateId}
                saveTemplate={saveTemplate}
                discardTemplateDraft={discardTemplateDraft}
                saveAllTemplates={saveAllTemplates}
                insertVariable={insertVariable}
                lastFocusedRef={lastFocusedRef}
                handleDrop={handleDrop}
                handleDragOver={handleDragOver}
              />
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
                    onChange={handleImportFileChange}
                    className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-600 hover:file:bg-blue-100"
                  />
                  {importFileError && <p className="text-sm text-red-500">{importFileError}</p>}
                  <p className="text-xs text-gray-400">Máx. 5 MB. Solo archivos .csv</p>
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
