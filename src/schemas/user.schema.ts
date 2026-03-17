import { z } from 'zod';

const passwordRules = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un símbolo');

export const createUserSchema = z
  .object({
    name: z.string().min(1, 'El nombre es obligatorio').max(255),
    email: z.string().min(1, 'El correo es obligatorio').email('Correo inválido'),
    password: passwordRules,
    password_confirmation: z.string().min(1, 'Confirma la contraseña'),
    role_id: z.number({ message: 'Selecciona un rol' }).int().positive(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  });

export const updateUserSchema = z
  .object({
    name: z.string().min(1, 'El nombre es obligatorio').max(255),
    email: z.string().min(1, 'El correo es obligatorio').email('Correo inválido'),
    password: passwordRules.optional().or(z.literal('')),
    password_confirmation: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password === data.password_confirmation;
      }
      return true;
    },
    {
      message: 'Las contraseñas no coinciden',
      path: ['password_confirmation'],
    },
  );

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
