import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/useAuth';
import { usersApi } from '../../api/users';
import { ApiError } from '../../api/client';
import { updateUserSchema, type UpdateUserFormData } from '../../schemas';
import { ROLE_LABELS } from '../../types/enums';
import { PageTransition, FadeIn } from '../../components/ui';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [success, setSuccess] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
      password_confirmation: '',
    },
  });

  const onSubmit = async (data: UpdateUserFormData) => {
    if (!user) return;
    setServerError('');
    setSuccess('');
    try {
      const payload: Record<string, string> = {
        name: data.name,
        email: data.email,
      };
      if (data.password && data.password.length > 0) {
        payload.password = data.password;
        payload.password_confirmation = data.password_confirmation ?? '';
      }
      const updated = await usersApi.update(user.id, payload);
      setUser(updated);
      setSuccess('Perfil actualizado correctamente');
      reset({ name: updated.name, email: updated.email, password: '', password_confirmation: '' });
    } catch (error) {
      setServerError(error instanceof ApiError ? error.data.message : 'Error al actualizar el perfil');
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg">
        <FadeIn className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mi perfil</h2>
          <p className="mt-1 text-sm text-gray-500">Actualiza tu nombre, correo o contraseña.</p>
        </FadeIn>

        {/* Avatar + role card */}
        <FadeIn delay={0.05} className="mb-6 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-500 text-xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.role && (
              <span className="mt-1 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200/60">
                {ROLE_LABELS[user.role.slug]}
              </span>
            )}
          </div>
        </FadeIn>

        {/* Form */}
        <FadeIn delay={0.1} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {serverError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
              <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-600 ring-1 ring-inset ring-green-200">
              <HiOutlineCheckCircle className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <HiOutlineUser className="mb-0.5 mr-1 inline h-4 w-4 text-gray-400" />
                Nombre
              </label>
              <input
                {...register('name')}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <HiOutlineMail className="mb-0.5 mr-1 inline h-4 w-4 text-gray-400" />
                Correo electrónico
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="mb-3 text-xs text-gray-400">Deja en blanco si no quieres cambiar la contraseña.</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    <HiOutlineLockClosed className="mb-0.5 mr-1 inline h-4 w-4 text-gray-400" />
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    <HiOutlineLockClosed className="mb-0.5 mr-1 inline h-4 w-4 text-gray-400" />
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    {...register('password_confirmation')}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {errors.password_confirmation && (
                    <p className="mt-1 text-sm text-red-500">{errors.password_confirmation.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
