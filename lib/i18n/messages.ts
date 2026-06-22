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
    chatLanguage: string;
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
    stats: {
      currentPlan: string;
      hoursRemaining: string;
      chatsToday: string;
      timeAvailable: string;
      unlimited: string;
      perRoom: string;
      notAvailable: string;
    };
  };
  history: {
    title: string;
    searchPlaceholder: string;
    filterFrom: string;
    filterTo: string;
    roomName: string;
    date: string;
    languages: string;
    duration: string;
    participants: string;
    lastActivity: string;
    reopen: string;
    closed: string;
    empty: string;
    proOnly: string;
    upgradeCta: string;
    loading: string;
    active: string;
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
  activeSession: {
    blockedTitle: string;
    blockedBody: string;
    activeCode: string;
  };
  chat: {
    soloOwnerTitle: string;
    soloOwnerHint: string;
  };
  landing: {
    tagline: string;
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    heroBullets: [string, string, string];
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
    plans: {
      free: { name: string; cta: string; features: string[] };
      room_pass: { name: string; cta: string; features: string[] };
      hours_24: { name: string; cta: string; features: string[] };
      pro: { name: string; cta: string; features: string[] };
    };
    planCard: {
      recommended: string;
      currentPlan: string;
      processing: string;
      perMonth: string;
      oneTime: string;
      usd: string;
      proTrialBadge: string;
      proTrialSubtext: string;
    };
    proTrialCallout: string;
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
      chatLanguage: 'Mi idioma en el chat',
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
      badge: 'conversa-io.chat',
      greeting: 'Hola, {name}',
      subtitle:
        'Traducción de conversaciones en tiempo real para conectar personas de cualquier parte del mundo.',
      createConversation: 'Crear conversación',
      joinConversation: 'Unirse a conversación',
      currentPlan: 'Plan actual:',
      planFree: 'Free',
      planPro: 'Pro',
      stats: {
        currentPlan: 'Plan actual',
        hoursRemaining: 'Horas restantes',
        chatsToday: 'Chats usados hoy',
        timeAvailable: 'Tiempo disponible',
        unlimited: 'Ilimitadas',
        perRoom: 'Por sala',
        notAvailable: '—',
      },
    },
    history: {
      title: 'Historial de conversaciones',
      searchPlaceholder: 'Buscar por nombre o código…',
      filterFrom: 'Desde',
      filterTo: 'Hasta',
      roomName: 'Sala',
      date: 'Fecha',
      languages: 'Idiomas',
      duration: 'Duración',
      participants: 'Participantes',
      lastActivity: 'Última actividad',
      reopen: 'Reabrir',
      closed: 'Cerrada',
      empty: 'Aún no tienes conversaciones en tu historial.',
      proOnly:
        'El historial de conversaciones está disponible únicamente para usuarios Pro.',
      upgradeCta: 'Upgrade to Pro',
      loading: 'Cargando historial…',
      active: 'Activa',
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
    activeSession: {
      blockedTitle: 'Ya tienes una sesión de chat activa',
      blockedBody:
        'Sal de la conversación en tu otro dispositivo antes de iniciar o unirte a otra sala.',
      activeCode: 'Código activo',
    },
    chat: {
      soloOwnerTitle: 'Invita a alguien para empezar',
      soloOwnerHint:
        'Comparte el enlace o muestra el código QR para que se unan a esta conversación.',
    },
    landing: {
      tagline: 'IA · Traducción en tiempo real',
      badge: 'Comunicación global con IA',
      heroTitle: 'Habla con cualquier persona, sin importar el idioma.',
      heroSubtitle:
        'Traducción de conversaciones en tiempo real para conectar personas de cualquier parte del mundo.',
      heroBullets: [
        'Conoce personas sin barreras de idioma.',
        'Traducción instantánea de mensajes y voz.',
        'Crea una sala y empieza a conversar en segundos.',
      ],
      createConversation: 'Crear conversación',
      joinConversation: 'Unirse a conversación',
      login: 'Iniciar sesión',
      register: 'Registrarse',
      liveTitle: 'Traducción instantánea, en vivo',
      liveSubtitle:
        'Conoce personas de cualquier parte del mundo sin barreras de idioma.',
      featuresTitle: 'Diseñado para conversaciones reales',
      featuresSubtitle:
        'Traducción de conversaciones en tiempo real para personas reales.',
      features: [
        'Habla con cualquier persona, sin importar el idioma.',
        'Conoce personas de cualquier parte del mundo sin barreras de idioma.',
        'Traducción de conversaciones en tiempo real para personas reales.',
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
        'Empieza gratis. Pase por sala $2.99 · Bolsa 24 h $4.99 · Pro $9.99/mes con 7 días de prueba.',
      plans: {
        free: {
          name: 'Free',
          cta: 'Probar gratis',
          features: [
            'Español ↔ Inglés',
            'Hasta 3 chats por día',
            'Hasta 5 minutos por chat',
            'Traducción de texto',
            'Sin registro obligatorio',
          ],
        },
        room_pass: {
          name: 'Plan por sala',
          cta: 'Comprar pase',
          features: [
            '1 hora de conversación',
            'Todos los idiomas principales desbloqueados',
            'Traducción de voz',
            'Speech-to-Text',
            'Text-to-Speech',
            'Traducción de texto ilimitada durante la sesión',
          ],
        },
        hours_24: {
          name: 'Plan 24 Horas',
          cta: 'Comprar bolsa',
          features: [
            'Bolsa de 24 horas de conversación',
            'Todos los idiomas principales desbloqueados',
            'Traducción de voz',
            'Speech-to-Text',
            'Text-to-Speech',
            'Mostrar horas restantes en todo momento',
            'Consumir horas únicamente durante sesiones activas',
          ],
        },
        pro: {
          name: 'Pro',
          cta: 'Probar 7 días gratis',
          features: [
            'Horas ilimitadas',
            'Todos los idiomas principales desbloqueados',
            'Traducción de voz',
            'Speech-to-Text',
            'Text-to-Speech',
            'Historial de conversaciones',
            'Funcionalidades premium futuras',
          ],
        },
      },
      planCard: {
        recommended: 'Recomendado',
        currentPlan: 'Plan actual',
        processing: 'Procesando…',
        perMonth: 'por mes',
        oneTime: 'pago único',
        usd: 'USD',
        proTrialBadge: '7 días de prueba gratis',
        proTrialSubtext: 'Luego $9.99/mes USD · cancela cuando quieras',
      },
      proTrialCallout:
        'El plan Pro incluye 7 días de prueba gratis. No se te cobrará hasta que termine el periodo de prueba.',
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
      chatLanguage: 'My chat language',
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
      badge: 'conversa-io.chat',
      greeting: 'Hello, {name}',
      subtitle:
        'Real-time conversation translation to connect people anywhere in the world.',
      createConversation: 'Create conversation',
      joinConversation: 'Join conversation',
      currentPlan: 'Current plan:',
      planFree: 'Free',
      planPro: 'Pro',
      stats: {
        currentPlan: 'Current plan',
        hoursRemaining: 'Hours remaining',
        chatsToday: 'Chats used today',
        timeAvailable: 'Time available',
        unlimited: 'Unlimited',
        perRoom: 'Per room',
        notAvailable: '—',
      },
    },
    history: {
      title: 'Conversation history',
      searchPlaceholder: 'Search by name or code…',
      filterFrom: 'From',
      filterTo: 'To',
      roomName: 'Room',
      date: 'Date',
      languages: 'Languages',
      duration: 'Duration',
      participants: 'Participants',
      lastActivity: 'Last activity',
      reopen: 'Reopen',
      closed: 'Closed',
      empty: 'You have no conversations in your history yet.',
      proOnly: 'Conversation history is available for Pro users only.',
      upgradeCta: 'Upgrade to Pro',
      loading: 'Loading history…',
      active: 'Active',
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
    activeSession: {
      blockedTitle: 'You already have an active chat session',
      blockedBody:
        'Leave the conversation on your other device before starting or joining another room.',
      activeCode: 'Active code',
    },
    chat: {
      soloOwnerTitle: 'Invite someone to get started',
      soloOwnerHint:
        'Share the link or show the QR code so others can join this conversation.',
    },
    landing: {
      tagline: 'AI · Real-time translation',
      badge: 'Global AI communication',
      heroTitle: 'Talk to anyone, no matter the language.',
      heroSubtitle:
        'Real-time conversation translation to connect people anywhere in the world.',
      heroBullets: [
        'Meet people without language barriers.',
        'Instant message and voice translation.',
        'Create a room and start chatting in seconds.',
      ],
      createConversation: 'Create conversation',
      joinConversation: 'Join conversation',
      login: 'Log in',
      register: 'Sign up',
      liveTitle: 'Instant live translation',
      liveSubtitle:
        'Meet people anywhere in the world without language barriers.',
      featuresTitle: 'Built for real conversations',
      featuresSubtitle:
        'Real-time conversation translation for real people.',
      features: [
        'Talk to anyone, no matter the language.',
        'Meet people anywhere in the world without language barriers.',
        'Real-time conversation translation for real people.',
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
        'Start free. Room pass $2.99 · 24 h pack $4.99 · Pro $9.99/mo with 7-day trial.',
      plans: {
        free: {
          name: 'Free',
          cta: 'Try for free',
          features: [
            'Spanish ↔ English',
            'Up to 3 chats per day',
            'Up to 5 minutes per chat',
            'Text translation',
            'No sign-up required',
          ],
        },
        room_pass: {
          name: 'Per-room plan',
          cta: 'Buy room pass',
          features: [
            '1 hour of conversation',
            'All major languages unlocked',
            'Voice translation',
            'Speech-to-Text',
            'Text-to-Speech',
            'Unlimited text translation during the session',
          ],
        },
        hours_24: {
          name: '24-hour plan',
          cta: 'Buy hour pack',
          features: [
            '24-hour conversation pack',
            'All major languages unlocked',
            'Voice translation',
            'Speech-to-Text',
            'Text-to-Speech',
            'Remaining hours shown at all times',
            'Hours consumed only during active sessions',
          ],
        },
        pro: {
          name: 'Pro',
          cta: 'Try 7 days free',
          features: [
            'Unlimited hours',
            'All major languages unlocked',
            'Voice translation',
            'Speech-to-Text',
            'Text-to-Speech',
            'Conversation history',
            'Future premium features',
          ],
        },
      },
      planCard: {
        recommended: 'Recommended',
        currentPlan: 'Current plan',
        processing: 'Processing…',
        perMonth: 'per month',
        oneTime: 'one-time',
        usd: 'USD',
        proTrialBadge: '7-day free trial',
        proTrialSubtext: 'Then $9.99/mo USD · cancel anytime',
      },
      proTrialCallout:
        'Pro includes a 7-day free trial. You won’t be charged until the trial ends (if eligible).',
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
