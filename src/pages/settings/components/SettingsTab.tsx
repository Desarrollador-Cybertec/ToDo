import type { SystemSetting } from '../../../types';
import { FadeIn } from '../../../components/ui';

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

export function SettingsTab({
  settings,
  drafts,
  updateDraft,
  hasPendingChanges,
  saving,
  onSave,
}: {
  settings: SystemSetting[];
  drafts: Record<string, string>;
  updateDraft: (key: string, value: string) => void;
  hasPendingChanges: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  const settingsByGroup = settings.reduce<Record<string, SystemSetting[]>>((acc, s) => {
    const group = s.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(settingsByGroup).map(([group, groupSettings]) => (
        <FadeIn key={group} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{GROUP_LABELS[group.toLowerCase()] ?? group}</h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {groupSettings.map((setting) => {
              const currentValue = drafts[setting.key] ?? setting.value;
              const isModified = setting.key in drafts;
              return (
                <div key={setting.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${isModified ? 'font-semibold text-blue-700 dark:text-blue-400' : 'font-medium text-gray-900 dark:text-gray-100'}`}>{SETTING_LABELS[setting.key] ?? setting.key}</p>
                    {setting.description && <p className="text-xs text-gray-400 dark:text-gray-500">{setting.description}</p>}
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
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
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
                        isModified ? 'border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
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
          onClick={onSave}
          disabled={!hasPendingChanges || saving}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
