# Roles, Accesos y Disposición de Vistas

> Documento generado a partir del escaneo completo del código fuente.  
> Última actualización: 19 de marzo de 2026

---

## 1. Roles del Sistema

| Slug | Etiqueta | Descripción |
|------|----------|-------------|
| `superadmin` | Super Administrador | Acceso total al sistema, gestión global de áreas, usuarios, configuración y reportes consolidados. |
| `area_manager` | Encargado de Área | Gestión de un área específica: equipo, tareas del área, reuniones y aprobación/rechazo de tareas. |
| `worker` | Trabajador | Ejecución de tareas asignadas, reporte de avances y acceso limitado a funciones de gestión. |

**Definición** (`src/types/enums.ts`):
```ts
export const Role = {
  SUPERADMIN:   'superadmin',
  AREA_MANAGER: 'area_manager',
  WORKER:       'worker',
} as const;
```

---

## 2. Mapa de Rutas y Acceso por Rol

### 2.1 Rutas Públicas (Solo invitados / no autenticados)

| Ruta | Componente | Comportamiento |
|------|-----------|----------------|
| `/login` | `LoginPage` | Solo accesible sin sesión. Si el usuario está autenticado, redirige a `/dashboard`. |

### 2.2 Rutas Protegidas (Requieren autenticación)

| Ruta | Componente | SUPERADMIN | AREA_MANAGER | WORKER | Restricción |
|------|-----------|:---:|:---:|:---:|-------------|
| `/dashboard` | `DashboardPage` | ✅ | ✅ | ✅ | Todos (vista diferenciada por rol) |
| `/tasks` | `TaskListPage` | ✅ | ✅ | ✅ | Todos |
| `/tasks/create` | `TaskCreatePage` | ✅ | ✅ | ✅ | Todos (formulario diferenciado) |
| `/tasks/:id` | `TaskDetailPage` | ✅ | ✅ | ✅ | Todos (acciones diferenciadas) |
| `/meetings` | `MeetingListPage` | ✅ | ✅ | ✅ | Sin restricción en ruta* |
| `/meetings/create` | `MeetingCreatePage` | ✅ | ✅ | ✅ | Sin restricción en ruta* |
| `/meetings/:id` | `MeetingDetailPage` | ✅ | ✅ | ✅ | Sin restricción en ruta* |
| `/claim-workers` | `ClaimWorkersPage` | ❌ | ✅ | ❌ | `allowedRoles: ['area_manager']` |
| `/areas` | `AreaListPage` | ✅ | ❌ | ❌ | `allowedRoles: ['superadmin']` |
| `/areas/create` | `AreaCreatePage` | ✅ | ❌ | ❌ | `allowedRoles: ['superadmin']` |
| `/areas/:id` | `AreaDetailPage` | ✅ | ❌ | ❌ | `allowedRoles: ['superadmin']` |
| `/users` | `UserListPage` | ✅ | ❌ | ❌ | `allowedRoles: ['superadmin']` |
| `/consolidated` | `ConsolidatedPage` | ✅ | ❌ | ❌ | `allowedRoles: ['superadmin']` |
| `/settings` | `SettingsPage` | ✅ | ❌ | ❌ | `allowedRoles: ['superadmin']` |

> \* Las reuniones no tienen restricción de ruta, pero el menú de navegación solo las muestra a **SUPERADMIN** y **AREA_MANAGER**.

### 2.3 Guards (Componentes de protección)

- **`ProtectedRoute`**: Verifica `isAuthenticated`. Acepta prop opcional `allowedRoles`. Si el rol del usuario no está permitido → redirige a `/dashboard`.
- **`GuestRoute`**: Si el usuario ya está autenticado → redirige a `/dashboard`.

---

## 3. Navegación Lateral (Sidebar) por Rol

| Elemento de Menú | Ruta | SUPERADMIN | AREA_MANAGER | WORKER |
|-------------------|------|:---:|:---:|:---:|
| Dashboard | `/dashboard` | ✅ | ✅ | ✅ |
| Tareas | `/tasks` | ✅ | ✅ | ✅ |
| Áreas | `/areas` | ✅ | ❌ | ❌ |
| Mi equipo | `/claim-workers` | ❌ | ✅ | ❌ |
| Reuniones | `/meetings` | ✅ | ✅ | ❌ |
| Usuarios | `/users` | ✅ | ❌ | ❌ |
| Consolidado | `/consolidated` | ✅ | ❌ | ❌ |
| Configuración | `/settings` | ✅ | ❌ | ❌ |

**Lógica de filtrado** (`AppLayout.tsx`):
```ts
const visibleItems = NAV_ITEMS.filter(
  (item) => !item.roles || (user && item.roles.includes(user.role.slug)),
);
```

---

## 4. Vistas del Dashboard por Rol

La ruta `/dashboard` muestra un componente distinto según el rol:

```ts
switch (user?.role.slug) {
  case Role.SUPERADMIN:   return <SuperAdminDashboard />;
  case Role.AREA_MANAGER: return <ManagerDashboardView />;
  default:                return <PersonalDashboardView />;
}
```

### 4.1 SuperAdminDashboard (`superadmin`)

| Sección | Contenido |
|---------|-----------|
| Resumen global | Total tareas activas, vencidas, tasa de completado |
| Distribución por estado | Tareas por cada status a nivel organización |
| Carga por usuario | Top 5 usuarios con más tareas pendientes |
| Por área | Conteo de tareas por área con enlace a cada una |
| Tareas personales | Tareas asignadas al propio superadmin |
| Acciones rápidas | "Nueva tarea" → `/tasks/create`, "Consolidado" → `/consolidated`, "Ver usuarios" |

### 4.2 ManagerDashboardView (`area_manager`)

| Sección | Contenido |
|---------|-----------|
| **Panel de Área (2/3 del ancho)** | |
| Resumen del área | Total, vencidas, sin avance, completadas, tasa de completado |
| Carga por miembro | Distribución de tareas por integrante del equipo |
| Distribución por estado | Tareas del área por status |
| **Panel Personal (1/3 del ancho)** | |
| Tareas urgentes | Vencidas o con prioridad alta/urgente |
| Próximas tareas | Tareas propias ordenadas por prioridad y fecha |
| Acciones rápidas | "Nueva tarea" → `/tasks/create`, "Mi equipo" → `/claim-workers` |

**Datos**: `dashboardApi.area(areaId)` + `dashboardApi.personal()`

### 4.3 PersonalDashboardView (`worker`)

| Sección | Contenido |
|---------|-----------|
| Tareas urgentes | Máx 4 tareas vencidas o con prioridad alta/urgente |
| Resumen rápido | Conteo: activas, vencidas, en revisión, completadas |
| Mis tareas activas | Máx 5 tareas (in_progress, in_review, rejected, overdue) |
| Tareas por iniciar | Tareas en pending o pending_assignment |
| Ayuda rápida | Tips de uso del sistema |
| Acciones rápidas | "Reportar avance" → `/tasks` |

**Datos**: `dashboardApi.personal()`

---

## 5. Gestión de Tareas — Permisos por Rol

### 5.1 Lista de Tareas (`TaskListPage`)

| Funcionalidad | SUPERADMIN | AREA_MANAGER | WORKER |
|---------------|:---:|:---:|:---:|
| Ver lista de tareas | ✅ | ✅ | ✅ |
| Botón "Nueva tarea" | ✅ | ✅ | ✅ |
| Botón "Editar" en cada tarea | ✅ | ✅ | ❌ |
| Filtro por área (dropdown) | ✅ | ❌ | ❌ |
| Filtros por estado, prioridad, orden | ✅ | ✅ | ✅ |

### 5.2 Creación de Tareas (`TaskCreatePage`)

| Comportamiento | SUPERADMIN | AREA_MANAGER | WORKER |
|----------------|:---:|:---:|:---:|
| Asignar a cualquier usuario del sistema | ✅ | ❌ | ❌ |
| Asignar a miembros de su área | ❌ | ✅ | ❌ |
| Asignar solo a sí mismo o email externo | ❌ | ❌ | ✅ |
| Definir prioridad | ✅ | ✅ | ✅ |
| Definir fechas (inicio/vencimiento) | ✅ | ✅ | ✅ |
| Configurar requisitos (adjunto, comentario, aprobación, notificación, progreso) | ✅ | ✅ | ✅ |

**Flujos de asignación del Worker:**
- **"Para mí"**: `assigned_to_user_id` = su propio ID
- **"Email externo"**: Solo se establece `external_email` y `external_name`

### 5.3 Detalle de Tarea (`TaskDetailPage`)

| Acción | SUPERADMIN | AREA_MANAGER | WORKER | Condición adicional |
|--------|:---:|:---:|:---:|---------------------|
| Ver detalle completo | ✅ | ✅ | ✅ | — |
| Editar tarea | ✅ | ✅ | ❌ | Tarea no COMPLETED/CANCELLED |
| Eliminar tarea | ✅ | ❌ | ❌ | — |
| Delegar tarea | ✅ | ✅* | ❌ | Tarea no terminal; *manager solo en su área |
| Subir archivo | ✅ | ✅ | ✅ | Si es responsable/creador y `requires_attachment=true` |
| Reportar avance | ✅ | ✅ | ✅ | Si es responsable/manager/admin y `requires_progress_report=true` |
| Agregar comentario | ✅ | ✅ | ✅ | Si `requires_completion_comment=true` |
| Aprobar tarea | ✅ | ✅ | ❌ | Si `requires_manager_approval=true` y tarea en `in_review` |
| Rechazar tarea | ✅ | ✅ | ❌ | Si `requires_manager_approval=true` y tarea en `in_review` |
| Enviar a revisión | ✅ | ❌ | ✅ | Si es responsable y tarea en `in_progress` |

### 5.4 Transiciones de Estado (TaskStatusSelect)

| Acción | Estado actual requerido | Quién puede | Detalles |
|--------|------------------------|-------------|----------|
| **Iniciar tarea** (`start`) | `pending`, `overdue`, `rejected` | Responsable de la tarea | Cambia a `in_progress` |
| **Enviar a revisión** (`submit_review`) | `in_progress` | Responsable de la tarea | Cambia a `in_review` |
| **Aprobar** (`approve`) | `in_review` | SUPERADMIN, AREA_MANAGER | Cambia a `completed` |
| **Rechazar** (`reject`) | `in_review` | SUPERADMIN, AREA_MANAGER | Requiere motivo. Cambia a `rejected` |
| **Cancelar** (`cancel`) | Cualquier estado no terminal | SUPERADMIN, AREA_MANAGER, Creador | Cambia a `cancelled` |
| **Reabrir** (`reopen`) | `completed`, `cancelled` | SUPERADMIN, AREA_MANAGER | Reabre la tarea |

**Definición de "Responsable":**
```ts
const isResponsible =
  task.current_responsible_user_id === userId ||
  task.current_responsible?.id === userId ||
  task.assigned_to_user_id === userId ||
  task.assigned_user?.id === userId;
```

### 5.5 Delegación de Tareas

- Solo se puede delegar a usuarios con rol `worker`.
- **SUPERADMIN**: Puede delegar cualquier tarea no terminal.
- **AREA_MANAGER**: Puede delegar tareas de su área (no las asignadas a sí mismo directamente en ciertos casos).
- **WORKER**: No puede delegar.

---

## 6. Estados de Tarea

| Estado | Slug | Etiqueta |
|--------|------|----------|
| Borrador | `draft` | Borrador |
| Pendiente de asignación | `pending_assignment` | Pendiente de asignación |
| Pendiente | `pending` | Pendiente |
| En progreso | `in_progress` | En progreso |
| En revisión | `in_review` | En revisión |
| Completada | `completed` | Completada |
| Rechazada | `rejected` | Rechazada |
| Cancelada | `cancelled` | Cancelada |
| Vencida | `overdue` | Vencida |

**Estados terminales:** `completed`, `cancelled`

---

## 7. Prioridades de Tarea

| Prioridad | Slug | Etiqueta |
|-----------|------|----------|
| Baja | `low` | Baja |
| Media | `medium` | Media |
| Alta | `high` | Alta |
| Urgente | `urgent` | Urgente |

---

## 8. Gestión de Áreas — Solo SUPERADMIN

| Funcionalidad | Ruta | Componente |
|---------------|------|-----------|
| Listar áreas | `/areas` | `AreaListPage` |
| Crear área | `/areas/create` | `AreaCreatePage` |
| Detalle de área | `/areas/:id` | `AreaDetailPage` |

**Secciones del detalle de área:**
- `AreaInfoSection` — Información general del área
- `AreaDashboardSection` — Dashboard de métricas del área
- `AreaTasksSection` — Tareas asociadas al área
- `AreaClaimSection` — Gestión de trabajadores del área
- `TeamMembersSection` — Miembros actuales del equipo
- `AvailableWorkersSection` — Trabajadores disponibles sin área

---

## 9. Gestión de Equipo — Solo AREA_MANAGER

| Funcionalidad | Ruta | Componente |
|---------------|------|-----------|
| Mi equipo (reclamar trabajadores) | `/claim-workers` | `ClaimWorkersPage` |

**Dos secciones:**
1. **Miembros del equipo**: Trabajadores ya asignados al área del manager.
2. **Trabajadores disponibles**: Trabajadores sin área asignada, que el manager puede reclamar.

---

## 10. Reuniones — SUPERADMIN y AREA_MANAGER

| Funcionalidad | Ruta | Componente |
|---------------|------|-----------|
| Listar reuniones | `/meetings` | `MeetingListPage` |
| Crear reunión | `/meetings/create` | `MeetingCreatePage` |
| Detalle de reunión | `/meetings/:id` | `MeetingDetailPage` |

**Clasificaciones de reunión:** Estratégica, Operativa, Seguimiento, Revisión, Otra

**Componentes asociados:**
- `MeetingDraftTaskForm` — Crear borradores de tarea desde reunión
- `MeetingTasksSection` — Tareas generadas en la reunión

> El sidebar oculta "Reuniones" al WORKER, aunque la ruta no tiene guard de rol explícito.

---

## 11. Gestión de Usuarios — Solo SUPERADMIN

| Funcionalidad | Ruta | Componente |
|---------------|------|-----------|
| Listar usuarios | `/users` | `UserListPage` |
| Crear usuario | (modal en `/users`) | `UserCreateForm` |
| Editar usuario | (modal en `/users`) | `UserEditModal` |

**Capacidades:**
- Filtrar por rol (superadmin, area_manager, worker)
- Crear nuevos usuarios con nombre, email, rol y área
- Editar nombre, email, rol, área
- Activar/desactivar usuarios

**Badges de rol:**
| Rol | Color |
|-----|-------|
| `superadmin` | Morado (purple) |
| `area_manager` | Azul (blue) |
| `worker` | Gris (gray) |

---

## 12. Configuración y Ajustes — Solo SUPERADMIN

| Funcionalidad | Ruta | Componente |
|---------------|------|-----------|
| Configuración del sistema | `/settings` | `SettingsPage` |

**Pestañas:**
1. **Settings** — Configuración general del sistema
2. **Templates** — Plantillas de mensajes/email
3. **Automation** — Flujos de automatización
4. **Import** — Importación de datos

---

## 13. Dashboard Consolidado — Solo SUPERADMIN

| Funcionalidad | Ruta | Componente |
|---------------|------|-----------|
| Vista consolidada | `/consolidated` | `ConsolidatedPage` |

**Contenido:**
- Resumen global: total tareas, completadas, activas, vencidas, tasa global de completado
- Desglose por área:
  - Nombre del área, encargado, tasa de completado
  - Conteos: total, completadas, vencidas, sin avance
  - Barra de progreso
  - Distribución de tareas por estado
  - Antigüedad de la tarea pendiente más vieja
  - Promedio de días sin actualización

---

## 14. Autenticación y Sesión

### Flujo de Autenticación
1. Usuario ingresa credenciales en `/login`
2. `authApi.login(email, password)` → Backend retorna token + objeto usuario con rol
3. Token almacenado en `sessionStorage`
4. `AuthProvider` llama a `authApi.me()` al montar para restaurar sesión
5. Rol disponible globalmente vía hook `useAuth()`

### Objeto de Usuario
```ts
interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
  role_id: number;
  role: { id: number; name: string; slug: RoleType };
  area_id?: number | null;
  created_at: string;
  updated_at: string;
}
```

### Acceso al Rol en Componentes
```ts
const { user } = useAuth();
user?.role.slug   // 'superadmin' | 'area_manager' | 'worker'
user?.area_id     // Área asignada (managers y workers)
```

### Manejo de Errores de Autenticación
- **401 Unauthorized**: Se elimina el token y redirige a `/login` automáticamente
- **Token**: Header `Authorization: Bearer <token>` en todas las peticiones

---

## 15. API — Módulos del Cliente

| Módulo | Archivo | Descripción |
|--------|---------|-------------|
| Auth | `src/api/auth.ts` | Login, logout, me (sesión actual) |
| Tasks | `src/api/tasks.ts` | CRUD de tareas, transiciones de estado, comentarios, adjuntos, delegación, actualizaciones |
| Areas | `src/api/areas.ts` | CRUD de áreas, miembros, reclamar trabajadores |
| Users | `src/api/users.ts` | CRUD de usuarios |
| Meetings | `src/api/meetings.ts` | CRUD de reuniones, tareas borrador de reunión |
| Dashboard | `src/api/dashboard.ts` | Dashboard personal, por área, global (superadmin) |
| Settings | `src/api/settings.ts` | Configuración del sistema, plantillas, automatización |
| Client | `src/api/client.ts` | Cliente HTTP base con interceptor de autenticación |

> La autorización por rol se ejecuta en el **backend**. El frontend envía el Bearer token y el backend valida los permisos según el rol del usuario.

---

## 16. Resumen Visual — Acceso por Rol

```
┌──────────────────────────────────────────────────────────────────────┐
│                        SUPERADMIN                                    │
├──────────────────────────────────────────────────────────────────────┤
│ Dashboard (SuperAdminDashboard)                                      │
│ Tareas        (lista + crear + detalle + editar + eliminar)          │
│ Áreas         (listar + crear + detalle)                             │
│ Reuniones     (listar + crear + detalle)                             │
│ Usuarios      (listar + crear + editar + activar/desactivar)         │
│ Consolidado   (vista global de métricas)                             │
│ Configuración (settings + templates + automation + import)           │
│ Acciones:     aprobar, rechazar, cancelar, reabrir, delegar          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                       AREA_MANAGER                                   │
├──────────────────────────────────────────────────────────────────────┤
│ Dashboard (ManagerDashboardView — panel de área + panel personal)    │
│ Tareas        (lista + crear + detalle + editar)                     │
│ Mi equipo     (reclamar trabajadores)                                │
│ Reuniones     (listar + crear + detalle)                             │
│ Acciones:     aprobar, rechazar, cancelar, reabrir, delegar (área)   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                         WORKER                                       │
├──────────────────────────────────────────────────────────────────────┤
│ Dashboard (PersonalDashboardView)                                    │
│ Tareas        (lista + crear* + detalle)                             │
│ Acciones:     iniciar, enviar a revisión, cancelar (si es creador)   │
│ * Crear: solo asignar a sí mismo o email externo                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 17. Requisitos Configurables por Tarea

Cada tarea puede tener activados o desactivados los siguientes requisitos, lo que habilita o deshabilita acciones en el detalle:

| Requisito | Campo | Efecto |
|-----------|-------|--------|
| Requiere adjunto | `requires_attachment` | Habilita el formulario de subir archivo |
| Requiere comentario de completado | `requires_completion_comment` | Habilita agregar comentario |
| Requiere aprobación del manager | `requires_manager_approval` | Habilita aprobar/rechazar |
| Requiere notificación de completado | `requires_completion_notification` | Envía notificación al completar |
| Requiere fecha de vencimiento | `requires_due_date` | Obliga a definir fecha |
| Requiere reporte de progreso | `requires_progress_report` | Habilita reportar avance |
| Notificar al vencer | `notify_on_due` | Notificación en fecha de vencimiento |
| Notificar al estar vencida | `notify_on_overdue` | Notificación cuando está vencida |
| Notificar al completar | `notify_on_completion` | Notificación de completado |

---

## 18. Tipos de Adjuntos

| Tipo | Slug | Etiqueta |
|------|------|----------|
| Evidencia | `evidence` | Evidencia |
| Soporte | `support` | Soporte |
| Entrega final | `final_delivery` | Entrega final |

**Restricciones de archivos:**
- Tamaño máximo: 10 MB
- Extensiones permitidas: `pdf, doc, docx, xls, xlsx, ppt, pptx, jpg, jpeg, png, gif, webp, txt, csv, zip, rar`

---

## 19. Tipos de Comentario

| Tipo | Slug |
|------|------|
| Comentario | `comment` |
| Progreso | `progress` |
| Nota de completado | `completion_note` |
| Nota de rechazo | `rejection_note` |
| Sistema | `system` |

---

## 20. Tipos de Actualización (Updates)

| Tipo | Slug |
|------|------|
| Progreso | `progress` |
| Evidencia | `evidence` |
| Nota | `note` |
