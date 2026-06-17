import type { AppLang } from './lang';

export type AppMessages = {
  common: {
    save: string;
    saved: string;
    loading: string;
    cancel: string;
    close: string;
    menu: string;
    language: string;
    spanish: string;
    english: string;
  };
  sidebar: {
    brandSubtitle: string;
    currentConversation: string;
    home: string;
    inviteQr: string;
    shareLink: string;
    createConversation: string;
    joinConversation: string;
    changePlan: string;
    profile: string;
    settings: string;
    register: string;
    login: string;
    logout: string;
  };
  home: {
    badge: string;
    greeting: string;
    subtitle: string;
    createConversation: string;
    joinConversation: string;
    currentPlan: string;
    planFree: string;
    planPro: string;
  };
  profile: {
    title: string;
    subtitleLoggedIn: string;
    subtitleGuest: string;
    loginPrompt: string;
    displayName: string;
    phone: string;
    nativeLanguage: string;
    avatar: string;
    uploadAvatar: string;
    removeAvatar: string;
    saveProfile: string;
    saved: string;
    phoneInvalid: string;
    saveError: string;
  };
  settings: {
    title: string;
    appearance: string;
    defaultLanguage: string;
    notifications: string;
    notificationsSoon: string;
    saveSettings: string;
    saved: string;
    account: string;
    myProfile: string;
    billing: string;
    login: string;
    register: string;
    logout: string;
    changePassword: string;
    newPassword: string;
    confirmPassword: string;
    updatePassword: string;
    passwordUpdated: string;
    passwordMismatch: string;
    passwordTooShort: string;
    passwordError: string;
    bio: string;
    bioHint: string;
    saveBio: string;
    bioSaved: string;
    appLanguage: string;
    appLanguageHint: string;
  };
  create: {
    title: string;
    subtitle: string;
    displayName: string;
    displayNamePlaceholder: string;
    displayNameHint: string;
    language: string;
    submit: string;
    submitBusy: string;
    backHome: string;
    errorDefault: string;
  };
  landing: {
    tagline: string;
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    createConversation: string;
    joinConversation: string;
    login: string;
    register: string;
    liveTitle: string;
    liveSubtitle: string;
    featuresTitle: string;
    featuresSubtitle: string;
    features: [string, string, string];
    chatOriginal: string;
    chatTranslated: string;
    joinTitle: string;
    joinSubtitle: string;
    joinPlaceholder: string;
    joinSubmit: string;
    pricingBadge: string;
    pricingTitle: string;
    pricingSubtitle: string;
    demoUsers: [{ name: string; text: string }, { name: string; text: string }, { name: string; text: string }];
  };
};

export const MESSAGES: Record<AppLang, AppMessages> = {
  es: {
    common: {
      save: 'Guardar',
      saved: 'Guardado',
      loading: 'Cargando…',
      cancel: 'Cancelar',
      close: 'Cerrar',
      menu: 'Menú',
      language: 'Idioma',
      spanish: 'Español',
      english: 'English',
    },
    sidebar: {
      brandSubtitle: 'Multilingüe',
      currentConversation: 'Conversación actual',
      home: 'Inicio',
      inviteQr: 'Invitar con QR',
      shareLink: 'Compartir enlace',
      createConversation: 'Crear conversación',
      joinConversation: 'Unirse a conversación',
      changePlan: 'Cambiar plan',
      profile: 'Perfil',
      settings: 'Configuración',
      register: 'Registrarse',
      login: 'Iniciar sesión',
      logout: 'Cerrar sesión',
    },
    home: {
      badge: 'Conversa',
      greeting: 'Hola, {name}',
      subtitle:
        'Crea una sala nueva o únete con un código para empezar a conversar con traducción en tiempo real.',
      createConversation: 'Crear conversación',
      joinConversation: 'Unirse a conversación',
      currentPlan: 'Plan actual:',
      planFree: 'Free',
      planPro: 'Pro',
    },
    profile: {
      title: 'Mi perfil',
      subtitleLoggedIn: 'Tu información se guarda en tu cuenta.',
      subtitleGuest: 'Inicia sesión para guardar tu perfil en la nube.',
      loginPrompt: 'Inicia sesión o crea una cuenta para guardar tu perfil.',
      displayName: 'Nombre visible',
      phone: 'Teléfono',
      nativeLanguage: 'Idioma principal',
      avatar: 'Foto de perfil',
      uploadAvatar: 'Subir foto',
      removeAvatar: 'Quitar foto',
      saveProfile: 'Guardar perfil',
      saved: 'Perfil guardado',
      phoneInvalid: 'Ingresa un número telefónico válido (10 a 15 dígitos).',
      saveError: 'No se pudo guardar el perfil',
    },
    settings: {
      title: 'Ajustes',
      appearance: 'Apariencia',
      defaultLanguage: 'Idioma por defecto (chat)',
      notifications: 'Notificaciones',
      notificationsSoon: 'Notificaciones (próximamente)',
      saveSettings: 'Guardar ajustes',
      saved: 'Ajustes guardados',
      account: 'Cuenta',
      myProfile: 'Mi perfil',
      billing: 'Planes y facturación',
      login: 'Iniciar sesión',
      register: 'Crear cuenta',
      logout: 'Cerrar sesión',
      changePassword: 'Cambiar contraseña',
      newPassword: 'Nueva contraseña',
      confirmPassword: 'Confirmar contraseña',
      updatePassword: 'Actualizar contraseña',
      passwordUpdated: 'Contraseña actualizada',
      passwordMismatch: 'Las contraseñas no coinciden',
      passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
      passwordError: 'No se pudo actualizar la contraseña',
      bio: 'Descripción',
      bioHint: 'Cuéntanos un poco sobre ti (visible en tu perfil).',
      saveBio: 'Guardar descripción',
      bioSaved: 'Descripción guardada',
      appLanguage: 'Idioma de la aplicación',
      appLanguageHint: 'Elige español o inglés para toda la interfaz.',
    },
    create: {
      title: 'Nueva conversación',
      subtitle: 'Solo necesitas tu nombre y tu idioma para empezar.',
      displayName: 'Nombre visible',
      displayNamePlaceholder: 'Cómo te verán los demás',
      displayNameHint:
        'Iniciarás como {name}. Puedes editar cómo te verán los demás.',
      language: 'Idioma',
      submit: 'Crear conversación',
      submitBusy: 'Creando…',
      backHome: 'Volver al inicio',
      errorDefault: 'No se pudo crear la conversación',
    },
    landing: {
      tagline: 'IA · Traducción en tiempo real',
      badge: 'Comunicación global con IA',
      heroTitle: 'Habla con cualquier persona en cualquier idioma.',
      heroSubtitle: 'Mensajes y voz traducidos por IA en tiempo real.',
      createConversation: 'Crear conversación',
      joinConversation: 'Unirse a conversación',
      login: 'Iniciar sesión',
      register: 'Registrarse',
      liveTitle: 'Traducción instantánea, en vivo',
      liveSubtitle:
        'Cada participante lee y escucha en su idioma. La IA traduce texto y voz al momento.',
      featuresTitle: 'Diseñado para conversaciones reales',
      featuresSubtitle:
        'Voz original y traducida, indicadores de actividad en tiempo real, participantes conectados y códigos QR para invitar al instante.',
      features: [
        'Traducción de texto y audio en tiempo real',
        'Whisper + TTS con caché inteligente',
        'Sin fricción: entra y habla en tu idioma',
      ],
      chatOriginal: 'Original (EN)',
      chatTranslated: 'Hola, ¿cómo estás?',
      joinTitle: 'Unirse con código',
      joinSubtitle: 'Pega el código del enlace o escanea el QR compartido.',
      joinPlaceholder: 'Ej. ABC12345',
      joinSubmit: 'Unirse',
      pricingBadge: 'Planes',
      pricingTitle: 'Escala cuando lo necesites',
      pricingSubtitle:
        'Empieza gratis. Pro desde $9.99/mes USD. Pase por sala $2.99 USD.',
      demoUsers: [
        { name: 'Usuario 1', text: 'Hello, how are you?' },
        { name: 'Usuario 2', text: 'Hola, ¿cómo estás?' },
        { name: 'Usuario 3', text: 'Bonjour, comment ça va ?' },
      ],
    },
  },
  en: {
    common: {
      save: 'Save',
      saved: 'Saved',
      loading: 'Loading…',
      cancel: 'Cancel',
      close: 'Close',
      menu: 'Menu',
      language: 'Language',
      spanish: 'Español',
      english: 'English',
    },
    sidebar: {
      brandSubtitle: 'Multilingual',
      currentConversation: 'Current conversation',
      home: 'Home',
      inviteQr: 'Invite with QR',
      shareLink: 'Share link',
      createConversation: 'Create conversation',
      joinConversation: 'Join conversation',
      changePlan: 'Change plan',
      profile: 'Profile',
      settings: 'Settings',
      register: 'Sign up',
      login: 'Log in',
      logout: 'Log out',
    },
    home: {
      badge: 'Conversa',
      greeting: 'Hello, {name}',
      subtitle:
        'Create a new room or join with a code to start chatting with real-time translation.',
      createConversation: 'Create conversation',
      joinConversation: 'Join conversation',
      currentPlan: 'Current plan:',
      planFree: 'Free',
      planPro: 'Pro',
    },
    profile: {
      title: 'My profile',
      subtitleLoggedIn: 'Your information is saved to your account.',
      subtitleGuest: 'Sign in to save your profile to the cloud.',
      loginPrompt: 'Sign in or create an account to save your profile.',
      displayName: 'Display name',
      phone: 'Phone number',
      nativeLanguage: 'Primary language',
      avatar: 'Profile photo',
      uploadAvatar: 'Upload photo',
      removeAvatar: 'Remove photo',
      saveProfile: 'Save profile',
      saved: 'Profile saved',
      phoneInvalid: 'Enter a valid phone number (10 to 15 digits).',
      saveError: 'Could not save profile',
    },
    settings: {
      title: 'Settings',
      appearance: 'Appearance',
      defaultLanguage: 'Default language (chat)',
      notifications: 'Notifications',
      notificationsSoon: 'Notifications (coming soon)',
      saveSettings: 'Save settings',
      saved: 'Settings saved',
      account: 'Account',
      myProfile: 'My profile',
      billing: 'Plans & billing',
      login: 'Log in',
      register: 'Create account',
      logout: 'Log out',
      changePassword: 'Change password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
      updatePassword: 'Update password',
      passwordUpdated: 'Password updated',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      passwordError: 'Could not update password',
      bio: 'Description',
      bioHint: 'Tell us a bit about yourself (shown on your profile).',
      saveBio: 'Save description',
      bioSaved: 'Description saved',
      appLanguage: 'App language',
      appLanguageHint: 'Choose Spanish or English for the entire interface.',
    },
    create: {
      title: 'New conversation',
      subtitle: 'You only need your name and language to get started.',
      displayName: 'Display name',
      displayNamePlaceholder: 'How others will see you',
      displayNameHint:
        "You'll start as {name}. You can edit how others see you.",
      language: 'Language',
      submit: 'Create conversation',
      submitBusy: 'Creating…',
      backHome: 'Back to home',
      errorDefault: 'Could not create the conversation',
    },
    landing: {
      tagline: 'AI · Real-time translation',
      badge: 'Global AI communication',
      heroTitle: 'Talk to anyone in any language.',
      heroSubtitle: 'AI-translated messages and voice in real time.',
      createConversation: 'Create conversation',
      joinConversation: 'Join conversation',
      login: 'Log in',
      register: 'Sign up',
      liveTitle: 'Instant live translation',
      liveSubtitle:
        'Every participant reads and hears in their language. AI translates text and voice on the fly.',
      featuresTitle: 'Built for real conversations',
      featuresSubtitle:
        'Original and translated voice, live activity indicators, connected participants, and QR codes to invite instantly.',
      features: [
        'Real-time text and audio translation',
        'Whisper + TTS with smart caching',
        'Frictionless: join and speak your language',
      ],
      chatOriginal: 'Original (EN)',
      chatTranslated: 'Hello, how are you?',
      joinTitle: 'Join with code',
      joinSubtitle: 'Paste the link code or scan the shared QR.',
      joinPlaceholder: 'E.g. ABC12345',
      joinSubmit: 'Join',
      pricingBadge: 'Plans',
      pricingTitle: 'Scale when you need to',
      pricingSubtitle:
        'Start free. Pro from $9.99/mo USD. Room pass $2.99 USD.',
      demoUsers: [
        { name: 'User 1', text: 'Hello, how are you?' },
        { name: 'User 2', text: 'Hola, ¿cómo estás?' },
        { name: 'User 3', text: 'Bonjour, comment ça va ?' },
      ],
    },
  },
};

/** Reemplaza `{key}` en plantillas simples. */
export function formatMessage(
  template: string,
  vars: Record<string, string>
): string {
  return Object.entries(vars).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, value),
    template
  );
}
