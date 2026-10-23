import type { Language } from '../types';

const es = {
  tabs: {
    communities: 'Comunidades',
    students: 'Estudiantes',
    volunteers: 'Voluntarios',
    profile: 'Mi perfil',
  },
  common: {
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    actions: 'Acciones',
    status: 'Estado',
    loading: 'Cargando...',
    selectUser: 'Selecciona un usuario',
    confirmDeleteTitle: 'Confirmar eliminación',
    deleting: 'Eliminando...',
    closeNotification: 'Cerrar notificación',
  },
  status: {
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
    published: 'Publicada',
    hidden: 'Oculta',
  },
  communities: {
    title: 'Comunidades',
    subtitle: 'Administra las comunidades que aparecen en el sitio.',
    newItem: 'Nueva comunidad',
    editTitle: 'Editar comunidad',
    createTitle: 'Nueva comunidad',
    name: 'Nombre *',
    description: 'Descripción',
    published: 'Publicada en el sitio',
    columnName: 'Nombre',
    columnDescription: 'Descripción',
    loading: 'Cargando comunidades...',
    empty: 'No hay comunidades registradas.',
    loadError: 'No se pudieron cargar las comunidades.',
    nameRequired: 'El nombre es obligatorio.',
    saveError: 'No se pudo guardar la comunidad.',
    deleteError: 'No se pudo eliminar la comunidad.',
    created: 'Comunidad creada correctamente.',
    updated: 'Comunidad actualizada correctamente.',
    deleted: 'Comunidad eliminada.',
    deleteMessage: '¿Eliminar la comunidad "{name}"? Esta acción no se puede deshacer.',
  },
  students: {
    title: 'Estudiantes internacionales',
    subtitle: 'Administra los perfiles de estudiantes internacionales.',
    newItem: 'Nuevo estudiante',
    editTitle: 'Editar estudiante',
    createTitle: 'Nuevo estudiante',
    candidateLabel: 'Estudiante registrado *',
    noCandidates:
      'No hay usuarios pendientes de perfil. Registra al estudiante como usuario primero.',
    university: 'Universidad',
    startDate: 'Fecha de inicio',
    endDate: 'Fecha de fin',
    columnStudent: 'Estudiante',
    columnUniversity: 'Universidad',
    columnPeriod: 'Periodo',
    loading: 'Cargando estudiantes...',
    empty: 'No hay estudiantes registrados.',
    loadError: 'No se pudieron cargar los estudiantes.',
    candidatesError: 'No se pudieron cargar los candidatos.',
    selectRequired: 'Debes seleccionar un estudiante.',
    saveError: 'No se pudo guardar el estudiante.',
    deleteError: 'No se pudo eliminar el estudiante.',
    created: 'Perfil de estudiante creado correctamente.',
    updated: 'Estudiante actualizado correctamente.',
    deleted: 'Perfil de estudiante eliminado.',
    deleteMessage: '¿Eliminar el perfil de {name}? Esta acción no se puede deshacer.',
  },
  volunteers: {
    title: 'Voluntarios y pasantes',
    subtitle: 'Administra los perfiles de voluntarios y pasantes.',
    newItem: 'Nuevo voluntario',
    editTitle: 'Editar voluntario',
    createTitle: 'Nuevo voluntario',
    candidateLabel: 'Voluntario registrado *',
    noCandidates:
      'No hay usuarios pendientes de perfil. Registra al voluntario como usuario primero.',
    interests: 'Intereses',
    availability: 'Disponibilidad',
    columnVolunteer: 'Voluntario',
    columnInterests: 'Intereses',
    columnAvailability: 'Disponibilidad',
    loading: 'Cargando voluntarios...',
    empty: 'No hay voluntarios registrados.',
    loadError: 'No se pudieron cargar los voluntarios.',
    candidatesError: 'No se pudieron cargar los candidatos.',
    selectRequired: 'Debes seleccionar un voluntario.',
    saveError: 'No se pudo guardar el voluntario.',
    deleteError: 'No se pudo eliminar el voluntario.',
    created: 'Perfil de voluntario creado correctamente.',
    updated: 'Voluntario actualizado correctamente.',
    deleted: 'Perfil de voluntario eliminado.',
    deleteMessage: '¿Eliminar el perfil de {name}? Esta acción no se puede deshacer.',
  },
  profile: {
    title: 'Mi perfil',
    subtitle: 'Consulta y actualiza los datos de tu cuenta.',
    loading: 'Cargando perfil...',
    loadError: 'No se pudo cargar el perfil.',
    name: 'Nombre completo *',
    email: 'Correo',
    role: 'Rol',
    participantType: 'Tipo de participante',
    save: 'Guardar cambios',
    nameRequired: 'El nombre es obligatorio.',
    saveError: 'No se pudo actualizar el perfil.',
    saved: 'Perfil actualizado correctamente.',
    roles: {
      admin: 'Administrador',
      manager: 'Gestor',
      user: 'Usuario',
      visitor: 'Visitante',
    },
    participantTypes: {
      international_student: 'Estudiante internacional',
      volunteer: 'Voluntario',
      intern: 'Pasante',
    },
  },
  search: {
    searching: 'Buscando...',
    error: 'No se pudo realizar la búsqueda.',
  },
};

export type AdminTexts = typeof es;

const en: AdminTexts = {
  tabs: {
    communities: 'Communities',
    students: 'Students',
    volunteers: 'Volunteers',
    profile: 'My profile',
  },
  common: {
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    actions: 'Actions',
    status: 'Status',
    loading: 'Loading...',
    selectUser: 'Select a user',
    confirmDeleteTitle: 'Confirm deletion',
    deleting: 'Deleting...',
    closeNotification: 'Close notification',
  },
  status: {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    published: 'Published',
    hidden: 'Hidden',
  },
  communities: {
    title: 'Communities',
    subtitle: 'Manage the communities shown on the site.',
    newItem: 'New community',
    editTitle: 'Edit community',
    createTitle: 'New community',
    name: 'Name *',
    description: 'Description',
    published: 'Published on the site',
    columnName: 'Name',
    columnDescription: 'Description',
    loading: 'Loading communities...',
    empty: 'No communities registered.',
    loadError: 'Could not load the communities.',
    nameRequired: 'Name is required.',
    saveError: 'Could not save the community.',
    deleteError: 'Could not delete the community.',
    created: 'Community created successfully.',
    updated: 'Community updated successfully.',
    deleted: 'Community deleted.',
    deleteMessage: 'Delete the community "{name}"? This action cannot be undone.',
  },
  students: {
    title: 'International students',
    subtitle: 'Manage international student profiles.',
    newItem: 'New student',
    editTitle: 'Edit student',
    createTitle: 'New student',
    candidateLabel: 'Registered student *',
    noCandidates: 'No users are pending a profile. Register the student as a user first.',
    university: 'University',
    startDate: 'Start date',
    endDate: 'End date',
    columnStudent: 'Student',
    columnUniversity: 'University',
    columnPeriod: 'Period',
    loading: 'Loading students...',
    empty: 'No students registered.',
    loadError: 'Could not load the students.',
    candidatesError: 'Could not load the candidates.',
    selectRequired: 'You must select a student.',
    saveError: 'Could not save the student.',
    deleteError: 'Could not delete the student.',
    created: 'Student profile created successfully.',
    updated: 'Student updated successfully.',
    deleted: 'Student profile deleted.',
    deleteMessage: 'Delete the profile for {name}? This action cannot be undone.',
  },
  volunteers: {
    title: 'Volunteers and interns',
    subtitle: 'Manage volunteer and intern profiles.',
    newItem: 'New volunteer',
    editTitle: 'Edit volunteer',
    createTitle: 'New volunteer',
    candidateLabel: 'Registered volunteer *',
    noCandidates: 'No users are pending a profile. Register the volunteer as a user first.',
    interests: 'Interests',
    availability: 'Availability',
    columnVolunteer: 'Volunteer',
    columnInterests: 'Interests',
    columnAvailability: 'Availability',
    loading: 'Loading volunteers...',
    empty: 'No volunteers registered.',
    loadError: 'Could not load the volunteers.',
    candidatesError: 'Could not load the candidates.',
    selectRequired: 'You must select a volunteer.',
    saveError: 'Could not save the volunteer.',
    deleteError: 'Could not delete the volunteer.',
    created: 'Volunteer profile created successfully.',
    updated: 'Volunteer updated successfully.',
    deleted: 'Volunteer profile deleted.',
    deleteMessage: 'Delete the profile for {name}? This action cannot be undone.',
  },
  profile: {
    title: 'My profile',
    subtitle: 'View and update your account details.',
    loading: 'Loading profile...',
    loadError: 'Could not load the profile.',
    name: 'Full name *',
    email: 'Email',
    role: 'Role',
    participantType: 'Participant type',
    save: 'Save changes',
    nameRequired: 'Name is required.',
    saveError: 'Could not update the profile.',
    saved: 'Profile updated successfully.',
    roles: {
      admin: 'Administrator',
      manager: 'Manager',
      user: 'User',
      visitor: 'Visitor',
    },
    participantTypes: {
      international_student: 'International student',
      volunteer: 'Volunteer',
      intern: 'Intern',
    },
  },
  search: {
    searching: 'Searching...',
    error: 'The search could not be completed.',
  },
};

export const adminTexts: Record<Language, AdminTexts> = { es, en };

export function statusLabel(status: string, language: Language): string {
  return (adminTexts[language].status as Record<string, string>)[status] ?? status;
}

export function roleLabel(role: string, language: Language): string {
  return (adminTexts[language].profile.roles as Record<string, string>)[role] ?? role;
}

export function participantTypeLabel(type: string, language: Language): string {
  return (
    (adminTexts[language].profile.participantTypes as Record<string, string>)[type] ?? type
  );
}

/** Converts an ISO timestamp ("2026-01-15T00:00:00.000Z") to the YYYY-MM-DD an <input type="date"> expects. */
export function dateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

/** Formats a date-only value for display, without the time component. */
export function formatDate(value: string | null, language: Language): string {
  if (!value) return '—';

  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;

  return language === 'es' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}
