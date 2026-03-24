import type { UseFormReturn } from 'react-hook-form';
import type { CreateUserFormData } from '../../../schemas';
import { SlideDown, Spinner } from '../../../components/ui';

interface Props {
  form: UseFormReturn<CreateUserFormData>;
  onSubmit: (data: CreateUserFormData) => void;
  onCancel: () => void;
}

export function UserCreateForm({ form, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  return (
    <SlideDown className="mb-6">
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Crear usuario</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre *</label>
              <input id="name" {...register('name')} className="w-full rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              {errors.name && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Correo *</label>
              <input id="email" type="email" {...register('email')} className="w-full rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              {errors.email && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña *</label>
              <input id="password" type="password" autoComplete="new-password" {...register('password')} className="w-full rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              {errors.password && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar contraseña *</label>
              <input id="password_confirmation" type="password" autoComplete="new-password" {...register('password_confirmation')} className="w-full rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              {errors.password_confirmation && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.password_confirmation.message}</p>}
            </div>
            <div>
              <label htmlFor="role_id" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Rol *</label>
              <select id="role_id" {...register('role_id', { valueAsNumber: true })} className="w-full rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="">Seleccionar rol</option>
                <option value={1}>Super Administrador</option>
                <option value={2}>Encargado de Área</option>
                <option value={3}>Trabajador</option>
              </select>
              {errors.role_id && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.role_id.message}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? <><Spinner size="sm" /> Creando...</> : 'Crear'}
            </button>
            <button type="button" onClick={onCancel} className="rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </SlideDown>
  );
}
