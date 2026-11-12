import type { Language } from '../types';

export interface AppTranslations {
  nav: {
    tagline: string;
    locations: string;
    brandSubtitle: string;
    selectLanguage: string;
    switchLanguage: string;
    checkingSession: string;
    adminAccess: string;
    signOut: string;
    signIn: string;
    goToHome: string;
    searchContent: string;
    search: string;
    tickets: string;
    donate: string;
    openMenu: string;
    closeMenu: string;
    menu: {
      home: string;
      about: string;
      shows: string;
      participate: string;
      joinUs: string;
    };
  };
  footer: {
    newsletterBadge: string;
    newsletterTitle: string;
    newsletterSubtitle: string;
    firstName: string;
    lastName: string;
    email: string;
    consent: string;
    subscribeBtn: string;
    processingBtn: string;
    successPending: string;
    successAlready: string;
    errorProcess: string;
    errorConnection: string;
    aboutDesc: string;
    taglineBadge: string;
    contactUsBtn: string;
    siteNav: string;
    homeAndShows: string;
    aboutImpact: string;
    shows: string;
    internships: string;
    donations: string;
    globalFootprint: string;
    contactAndInfo: string;
    loadingContacts: string;
    errorContacts: string;
    noContacts: string;
    copyright: string;
  };
  searchModal: {
    placeholder: string;
    minChars: string;
    searching: string;
    noResults: string;
    eventsAndShows: string;
    projectsAndImpact: string;
    communities: string;
    opportunities: string;
    closeHint: string;
    errorQuery: string;
  };
  auth: {
    registerTitle: string;
    registerSubtitle: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordHelp: string;
    confirmPassword: string;
    createAccountBtn: string;
    creatingAccountBtn: string;
    orContinueWith: string;
    alreadyHaveAccount: string;
    signInHere: string;
    googleSuccess: (name: string) => string;
    errors: {
      fullNameRequired: string;
      passwordsDoNotMatch: string;
      registerFailed: string;
      serverError: string;
    };
    success: {
      accountCreated: string;
    };
    loginTitle: string;
    loginSubtitle: string;
    loginBtn: string;
    loggingInBtn: string;
    noAccountYet: string;
    registerHere: string;
  };
  modals: {
    volunteer: {
      title: string;
      locationAndPeriod: string;
      fullName: string;
      fullNamePlaceholder: string;
      email: string;
      country: string;
      countryPlaceholder: string;
      experience: string;
      experiencePlaceholder: string;
      attachCV: string;
      attachCVPlaceholder: string;
      browseFile: string;
      submitBtn: string;
      submittingBtn: string;
      successTitle: string;
      successMessage: (name: string, roleTitle: string) => string;
      successEmailNotice: (email: string) => string;
      closeBtn: string;
    };
    ticket: {
      headerTitle: string;
      step1: string;
      step2: string;
      selectDate: string;
      quantity: string;
      total: string;
      proceedToPatronInfo: string;
      patronTitle: string;
      fullName: string;
      fullNamePlaceholder: string;
      email: string;
      phone: string;
      paymentOption: string;
      sinpeTitle: string;
      sinpeNumber: string;
      sinpeInstructions: (crc: string) => string;
      sinpeRefLabel: string;
      sinpeRefPlaceholder: string;
      sinpeProofLabel: string;
      sinpeProofPlaceholder: string;
      browseProof: string;
      processingPurchase: string;
      completeSinpeBtn: string;
      sinpeSuccessTitle: string;
      sinpeSuccessMsg: (crc: string, ref: string, email: string) => string;
      confirmedTitle: string;
      confirmedSubtitle: (email: string) => string;
      officialTicketBadge: string;
      ticketPatron: string;
      ticketCount: (q: number) => string;
      ticketDate: string;
      ticketTotal: string;
      yourTickets: string;
      ticketItem: (index: number) => string;
      qrCodeTitle: string;
      qrCodeSubtitle: string;
      closeAndReturn: string;
    };
    donation: {
      title: string;
      subtitle: string;
      selectAmount: string;
      customAmountPlaceholder: string;
      paymentOption: string;
      sinpeTitle: string;
      sinpeNumber: string;
      sinpeInstructions: (amount: number | string) => string;
      sinpeRefLabel: string;
      sinpeRefPlaceholder: string;
      zeffyTitle: string;
      zeffySubtitle: string;
      cardTitle: string;
      cardSubtitle: string;
      donorName: string;
      donorNamePlaceholder: string;
      donorEmail: string;
      completeDonationBtn: (amount: number | string) => string;
      successTitle: string;
      successMsg: (amount: number | string) => string;
      receiptNotice: (email: string) => string;
      closeBtn: string;
    };
  };
  views: {
    home: {
      tagline: string;
      titleCommunity: string;
      heroDescription: string;
      buyTicketsBtn: string;
      internshipBtn: string;
      stats: {
        countries: string;
        showsProduced: string;
        youthImpacted: string;
        scholarships: string;
      };
      nowPlaying: string;
      generalDirection: string;
      availableTickets: (count: number) => string;
      ticketPrice: string;
      reserveTicketsNow: string;
      repertoryBadge: string;
      theatricalHistory: string;
      viewFullCatalog: string;
      buyTickets: string;
      viewProgram: string;
      presenceBadge: string;
      projectsTitle: string;
      projectsDesc: string;
      ctaTitle: string;
      ctaDesc: string;
      applyInternship: string;
      makeDonation: string;
    };
    about: {
      badge: string;
      title: string;
      desc: string;
      originsTitle: string;
      geoReach: string;
      futureVision: string;
    };
    shows: {
      badge: string;
      title: string;
      desc: string;
      tab2026: string;
      tabAll: string;
      tabHistory: string;
      buyTickets: string;
      viewProgram: string;
    };
    participate: {
      badge: string;
      title: string;
      desc: string;
      campBadge: string;
      campTitle: string;
      campDesc: string;
      campBullets: {
        ages: string;
        scholarships: string;
        faculty: string;
        shows: string;
      };
      applyCampBtn: string;
      openCallsBadge: string;
      openCallsTitle: string;
      applyRoleBtn: string;
    };
    contact: {
      title: string;
      subtitle: string;
      formTitle: string;
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      subjectLabel: string;
      subjectPlaceholder: string;
      messageLabel: string;
      messagePlaceholder: string;
      sendBtn: string;
      sendingBtn: string;
      successTitle: string;
      successMsg: string;
      sendAnotherBtn: string;
      errorDefault: string;
      channelsTitle: string;
      channelsSubtitle: string;
    };
    donate: {
      badge: string;
      title: string;
      subtitle: string;
      registerTitle: string;
      registerSubtitle: string;
      sinpeNumberTitle: string;
      sinpeInstructions: string;
      sinpeRefLabel: string;
      sinpeRefPlaceholder: string;
      zeffyTitle: string;
      zeffySubtitle: string;
      cardTitle: string;
      cardSubtitle: string;
      donorNameLabel: string;
      donorNamePlaceholder: string;
      donorEmailLabel: string;
      donorEmailPlaceholder: string;
      amountLabel: string;
      processingBtn: string;
      submitBtn: (amount: string) => string;
      successTitle: string;
      successMsg: (name: string, amount: string) => string;
      registerAnotherBtn: string;
    };
  };
}

const es: AppTranslations = {
  nav: {
    tagline: 'Arte que Conecta Comunidades',
    locations: 'Costa Rica • China • Mozambique',
    brandSubtitle: 'Teatro Comunitario',
    selectLanguage: 'Seleccionar idioma',
    switchLanguage: 'Cambiar idioma a inglés',
    checkingSession: 'Verificando sesión…',
    adminAccess: 'Acceso admin',
    signOut: 'Cerrar sesión',
    signIn: 'Iniciar sesión',
    goToHome: 'Far Corners, ir al inicio',
    searchContent: 'Buscar contenido',
    search: 'Buscar',
    tickets: 'Boletos',
    donate: 'Donar',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    menu: {
      home: 'Inicio',
      about: 'Historia e Impacto',
      shows: 'Cartelera',
      participate: 'Programas y Comunidad',
      joinUs: 'Únete',
    },
  },
  footer: {
    newsletterBadge: 'Integración Mailchimp',
    newsletterTitle: 'Suscríbete a Nuestro Boletín',
    newsletterSubtitle:
      'Recibe noticias de nuestras producciones teatrales, audiciones, becas e historias de impacto comunitario.',
    firstName: 'Nombre *',
    lastName: 'Apellido *',
    email: 'Correo electrónico *',
    consent: 'Acepto recibir el boletín y comunicaciones promocionales de FarCorners. *',
    subscribeBtn: 'Suscribirse',
    processingBtn: 'Procesando…',
    successPending: 'Solicitud procesada correctamente.',
    successAlready: 'Este correo ya se encuentra registrado.',
    errorProcess: 'No se pudo procesar la suscripción.',
    errorConnection: 'No se pudo conectar con el servidor.',
    aboutDesc:
      'Organización teatral internacional sin fines de lucro enfocada en brindar oportunidades artísticas y educativas a jóvenes de comunidades en Costa Rica, China y Mozambique.',
    taglineBadge: 'Arte que Conecta Comunidades',
    contactUsBtn: 'Contáctanos',
    siteNav: 'Navegación Sitio',
    homeAndShows: 'Inicio & Cartelera',
    aboutImpact: 'Historia e Impacto Global',
    shows: 'Obras Teatrales',
    internships: 'Pasantías y Voluntariado',
    donations: 'Donaciones y Registro',
    globalFootprint: 'Presencia Internacional',
    contactAndInfo: 'Contacto e Información',
    loadingContacts: 'Cargando...',
    errorContacts: 'No se pudieron cargar los contactos.',
    noContacts: 'No hay contactos publicados.',
    copyright: '© 2026 Far Corners Teatro Comunitario. Todos los derechos reservados.',
  },
  searchModal: {
    placeholder: 'Buscar obras, proyectos, comunidades, pasantías...',
    minChars: 'Escribe al menos 2 caracteres para buscar.',
    searching: 'Buscando...',
    noResults: 'No se encontraron resultados para tu búsqueda.',
    eventsAndShows: 'Eventos y Obras',
    projectsAndImpact: 'Proyectos e Impacto',
    communities: 'Comunidades',
    opportunities: 'Pasantías y Voluntariado',
    closeHint: 'Presiona ESC o la X para cerrar la búsqueda',
    errorQuery: 'No se pudo completar la búsqueda.',
  },
  auth: {
    registerTitle: 'Crear una cuenta',
    registerSubtitle: 'Forma parte de la comunidad de Far Corners.',
    fullName: 'Nombre completo',
    fullNamePlaceholder: 'Ej. Juan Pérez',
    email: 'Correo electrónico',
    emailPlaceholder: 'tu@correo.com',
    password: 'Contraseña',
    passwordHelp: 'Usa entre 10 y 128 caracteres. Puedes usar una frase.',
    confirmPassword: 'Confirmar contraseña',
    createAccountBtn: 'Crear cuenta',
    creatingAccountBtn: 'Creando cuenta…',
    orContinueWith: 'O continuar con',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    signInHere: 'Inicia sesión aquí',
    googleSuccess: (name: string) => `¡Bienvenido ${name}! Has iniciado sesión con Google.`,
    errors: {
      fullNameRequired: 'Ingresa tu nombre completo.',
      passwordsDoNotMatch: 'Las contraseñas no coinciden.',
      registerFailed: 'No se pudo registrar la cuenta.',
      serverError: 'No se pudo conectar con la API. Inténtalo nuevamente.',
    },
    success: {
      accountCreated: 'Cuenta creada correctamente. Ya puedes iniciar sesión.',
    },
    loginTitle: 'Iniciar Sesión',
    loginSubtitle: 'Accede a tu cuenta de Far Corners.',
    loginBtn: 'Iniciar sesión',
    loggingInBtn: 'Iniciando sesión…',
    noAccountYet: '¿No tienes una cuenta?',
    registerHere: 'Regístrate aquí',
  },
  modals: {
    volunteer: {
      title: 'Formulario de Postulación',
      locationAndPeriod: 'Ubicación y Duración:',
      fullName: 'Nombre Completo *',
      fullNamePlaceholder: 'Ej. Sofia Watson',
      email: 'Correo Electrónico *',
      country: 'País de Residencia *',
      countryPlaceholder: 'Costa Rica / EE.UU...',
      experience: 'Experiencia / Motivación *',
      experiencePlaceholder: 'Cuéntanos brevemente sobre tu formación en teatro, música o tu interés en participar...',
      attachCV: 'Adjuntar Hoja de Vida / Resumen (Opcional)',
      attachCVPlaceholder: 'Haz clic para seleccionar archivo PDF o DOCX',
      browseFile: 'Examinar archivo',
      submitBtn: 'Enviar Postulación Oficial',
      submittingBtn: 'Enviando postulación...',
      successTitle: '¡Postulación Recibida!',
      successMessage: (name: string, roleTitle: string) =>
        `Gracias, ${name}. El equipo directivo de Far Corners evaluará tu perfil para el puesto de ${roleTitle}.`,
      successEmailNotice: (email: string) =>
        `Recibirás una notificación por correo electrónico (${email}) para agendar una entrevista virtual.`,
      closeBtn: 'Entendido',
    },
    ticket: {
      headerTitle: 'Boletería Far Corners Teatro Comunitario',
      step1: 'Entradas & Fecha',
      step2: 'Datos del Comprador',
      selectDate: 'Selecciona la Función:',
      quantity: 'Cantidad de Boletos:',
      total: 'Total a Pagar:',
      proceedToPatronInfo: 'Continuar a Datos del Comprador',
      patronTitle: 'Datos del Comprador',
      fullName: 'Nombre Completo *',
      fullNamePlaceholder: 'Ej. María Rodríguez',
      email: 'Correo Electrónico *',
      phone: 'Teléfono *',
      paymentOption: 'Selecciona Modo de Pago:',
      sinpeTitle: 'SINPE Móvil (Costa Rica)',
      sinpeNumber: 'Número SINPE Móvil Oficial:',
      sinpeInstructions: (crc: string) =>
        `Transfiere ₡${crc} CRC a nombre de Far Corners Teatro Comunitario.`,
      sinpeRefLabel: 'Número de Referencia SINPE *',
      sinpeRefPlaceholder: 'Ej. #8920192',
      sinpeProofLabel: 'Adjuntar Comprobante de Pago (Imagen o PDF) *',
      sinpeProofPlaceholder: 'Haz clic para seleccionar el archivo de comprobante',
      browseProof: 'Examinar Comprobante',
      processingPurchase: 'Procesando Compra...',
      completeSinpeBtn: 'Completar Registro de Pago SINPE',
      sinpeSuccessTitle: '¡Comprobante SINPE Recibido!',
      sinpeSuccessMsg: (crc: string, ref: string, email: string) =>
        `Hemos registrado tu pago de ₡${crc} (Ref: ${ref}). Se enviaron los boletos a ${email}.`,
      confirmedTitle: '¡Reserva y Boleto Confirmado!',
      confirmedSubtitle: (email: string) =>
        `Se ha enviado la confirmación y los boletos digitales a ${email}.`,
      officialTicketBadge: 'BOLETO OFICIAL',
      ticketPatron: 'Titular:',
      ticketCount: (q: number) => `${q} x (Entrada General)`,
      ticketDate: 'Fecha:',
      ticketTotal: 'Total:',
      yourTickets: 'Tus Boletos Digitales:',
      ticketItem: (index: number) => `Boleto #${index}`,
      qrCodeTitle: 'Código de Acceso QR',
      qrCodeSubtitle: 'Muestra este código al ingresar al teatro',
      closeAndReturn: 'Cerrar y Volver',
    },
    donation: {
      title: 'Donar a Far Corners Teatro Comunitario',
      subtitle: '100% destinado a programas juveniles e impacto comunitario',
      selectAmount: 'Selecciona un Monto en Dólares ($ USD):',
      customAmountPlaceholder: 'Otro monto en dólares ($ USD)...',
      paymentOption: 'Selecciona Modo de Pago:',
      sinpeTitle: 'SINPE Móvil (Costa Rica)',
      sinpeNumber: 'Número SINPE Móvil:',
      sinpeInstructions: (amount: number | string) =>
        `Transfiere el equivalente a $${amount} USD a nombre de Far Corners Teatro Comunitario.`,
      sinpeRefLabel: 'Número de Referencia SINPE (Opcional):',
      sinpeRefPlaceholder: 'Ej. #8920192',
      zeffyTitle: 'Integración Zeffy Payments (0% Comisión)',
      zeffySubtitle: 'El 100% de tu contribución llega directo a nuestras becas y producciones.',
      cardTitle: 'Pasarela Segura SSL Stripe & PayPal',
      cardSubtitle: 'Procesamiento directo con tarjeta internacional.',
      donorName: 'Nombre Completo *',
      donorNamePlaceholder: 'Tu nombre...',
      donorEmail: 'Correo Electrónico *',
      completeDonationBtn: (amount: number | string) => `Completar Donación de $${amount} USD`,
      successTitle: '¡Muchas Gracias por tu Aporte!',
      successMsg: (amount: number | string) =>
        `Tu contribución de $${amount} USD permite seguir financiando becas de teatro musical y producciones comunitarias.`,
      receiptNotice: (email: string) => `Se enviará el recibo oficial al correo ${email}.`,
      closeBtn: 'Finalizar',
    },
  },
  views: {
    home: {
      tagline: 'Arte que Conecta Comunidades • Costa Rica',
      titleCommunity: 'Teatro Comunitario',
      heroDescription:
        'Creemos en el poder del arte para transformar, inspirar y unir personas. Creamos experiencias escénicas que fortalecen la comunidad y abren espacios de expresión para todos.',
      buyTicketsBtn: 'Comprar Boletos 2026',
      internshipBtn: 'Programa de Pasantías',
      stats: {
        countries: 'Países de Impacto',
        showsProduced: 'Obras Producidas',
        youthImpacted: 'Jóvenes Beneficiados',
        scholarships: 'Becas Sociales',
      },
      nowPlaying: 'EN CARTELERA 2026',
      generalDirection: 'Dirección General:',
      availableTickets: (count: number) => `${count} entradas`,
      ticketPrice: 'Precio de Entrada:',
      reserveTicketsNow: 'Reservar Boletos Ahora',
      repertoryBadge: 'Repertorio Teatral',
      theatricalHistory: 'Nuestras Obras Teatrales',
      viewFullCatalog: 'Ver cartelera completa',
      buyTickets: 'Adquirir Boletos',
      viewProgram: 'Ver programa de mano',
      presenceBadge: 'Presencia e Impacto',
      projectsTitle: 'Proyectos en Costa Rica, China y Mozambique',
      projectsDesc:
        'Far Corners conecta comunidades y abre espacios de expresión para todos a través del teatro musical.',
      ctaTitle: '¿Quieres Ser Parte de Nuestra Historia?',
      ctaDesc:
        'Únete como voluntario, postulante a pasantías internacionales o apoyando nuestras becas para jóvenes comunitarios.',
      applyInternship: 'Postularse a Pasantía',
      makeDonation: 'Hacer una Donación',
    },
    about: {
      badge: 'Nuestra Esencia & Historia',
      title: 'Historia, Valores e Impacto',
      desc:
        'Far Corners es un teatro comunitario que cree en el poder del arte para transformar, inspirar y unir personas. Creamos experiencias escénicas que fortalecen la comunidad, celebran la diversidad y abren espacios de expresión para todos.',
      originsTitle: 'Origen e Historia del Teatro',
      geoReach: 'Impacto Geográfico',
      futureVision: 'Visión de futuro',
    },
    shows: {
      badge: 'Cartelera Teatral 2026 & Archivo',
      title: 'Cartelera de Obras Teatrales',
      desc:
        'Explora las producciones de la Temporada 2026 y el repertorio histórico del Teatro Comunitario Far Corners.',
      tab2026: 'Cartelera 2026',
      tabAll: 'Todas las Obras',
      tabHistory: 'Archivo Histórico',
      buyTickets: 'Comprar Boletos',
      viewProgram: 'Ver programa de mano',
    },
    participate: {
      badge: 'Participación e Intercambio',
      title: 'Únete al Programa Far Corners',
      desc:
        'Descubre oportunidades para estudiantes locales, pasantías universitarias internacionales y voluntariado cyber o presencial.',
      campBadge: 'CAMPAMENTO DE VERANO BILINGÜE',
      campTitle: 'Costa Rica Theatre Camp (CRTC)',
      campDesc:
        'Un programa de inmersión total en Monteverde, Puntarenas. Los participantes reciben formación en canto, danza y actuación mientras ensayan el musical de la temporada para presentarlo ante el público costarricense.',
      campBullets: {
        ages: 'Edades: 8 a 18 años',
        scholarships: '100% Becas locales disponibles',
        faculty: 'Instructorado bilingüe de nivel internacional',
        shows: 'Funciones estelares abiertas al público',
      },
      applyCampBtn: 'Postular al Campamento 2026',
      openCallsBadge: 'Convocatorias Abiertas Verano 2026',
      openCallsTitle: 'Pasantías Internacionales y Voluntariado',
      applyRoleBtn: 'Postular a este Puesto',
    },
    contact: {
      title: 'Contacto Directo',
      subtitle: 'Comunícate con nuestro equipo en Costa Rica o a nivel internacional.',
      formTitle: 'Envíanos un Mensaje',
      nameLabel: 'Nombre Completo *',
      namePlaceholder: 'Ej. Daniel Zeas',
      emailLabel: 'Correo Electrónico *',
      emailPlaceholder: 'daniel@correo.com',
      subjectLabel: 'Asunto de Consulta *',
      subjectPlaceholder: 'Pasantías / Boletos / Donaciones / Prensa...',
      messageLabel: 'Mensaje Detallado *',
      messagePlaceholder: 'Escribe tu consulta o propuesta aquí...',
      sendBtn: 'Enviar Mensaje a Far Corners',
      sendingBtn: 'Enviando Mensaje...',
      successTitle: '¡Mensaje Enviado con Éxito!',
      successMsg: 'Gracias por escribirnos. Nuestro equipo se comunicará contigo lo antes posible.',
      sendAnotherBtn: 'Enviar otro mensaje',
      errorDefault: 'No se pudo enviar el mensaje.',
      channelsTitle: 'Canales de Atención Oficiales',
      channelsSubtitle: 'Sedes y Canales de Comunicación Far Corners',
    },
    donate: {
      badge: 'Recaudación de Fondos & Apoyo',
      title: 'Donaciones al Teatro Far Corners',
      subtitle:
        'Tu donación financia directamente becas de campamento, vestuario, utilería e infraestructura teatral para jóvenes comunitarios en Costa Rica.',
      registerTitle: 'Registrar una Donación',
      registerSubtitle:
        'Selecciona el modo de pago e ingresa el monto en dólares ($ USD) para realizar tu aporte.',
      sinpeNumberTitle: 'Número SINPE Móvil Oficial:',
      sinpeInstructions:
        'Transfiere el equivalente de tu donación en dólares a nombre de Far Corners Teatro Comunitario.',
      sinpeRefLabel: 'Número de Referencia SINPE (Opcional):',
      sinpeRefPlaceholder: 'Ej. #8920192',
      zeffyTitle: 'Zeffy Payments (0% Comisión)',
      zeffySubtitle:
        'Plataforma 100% gratuita para ONG. El 100% de tu dinero llega directo al programa.',
      cardTitle: 'Pasarela Segura SSL Stripe & PayPal',
      cardSubtitle:
        'Procesamiento seguro directo con tarjeta de crédito o débito internacional.',
      donorNameLabel: 'Nombre Completo del Donante *',
      donorNamePlaceholder: 'Tu nombre...',
      donorEmailLabel: 'Correo Electrónico *',
      donorEmailPlaceholder: 'tu@correo.com',
      amountLabel: 'Monto Donado ($ USD Solo Dólares) *',
      processingBtn: 'Procesando Donación...',
      submitBtn: (amount: string) => `Completar Registro de Donación ($${amount} USD)`,
      successTitle: '¡Donación Registrada Exitosamente!',
      successMsg: (name: string, amount: string) =>
        `Gracias ${name}. Hemos registrado tu aporte de $${amount} USD en nuestro sistema.`,
      registerAnotherBtn: 'Registrar Otra Donación',
    },
  },
};

const en: AppTranslations = {
  nav: {
    tagline: 'Art Connecting Communities',
    locations: 'Costa Rica • China • Mozambique',
    brandSubtitle: 'Community Theatre',
    selectLanguage: 'Select language',
    switchLanguage: 'Switch language to Spanish',
    checkingSession: 'Checking session…',
    adminAccess: 'Admin access',
    signOut: 'Sign out',
    signIn: 'Sign in',
    goToHome: 'Far Corners, go to home',
    searchContent: 'Search content',
    search: 'Search',
    tickets: 'Tickets',
    donate: 'Donate',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    menu: {
      home: 'Home',
      about: 'About & Impact',
      shows: 'Shows',
      participate: 'Programs & Community',
      joinUs: 'Join us',
    },
  },
  footer: {
    newsletterBadge: 'Mailchimp Newsletter',
    newsletterTitle: 'Subscribe to Our Newsletter',
    newsletterSubtitle:
      'Receive updates on our theatre productions, auditions, scholarships, and community impact stories.',
    firstName: 'First name *',
    lastName: 'Last name *',
    email: 'Email address *',
    consent: 'I agree to receive the FarCorners newsletter and promotional communications. *',
    subscribeBtn: 'Subscribe',
    processingBtn: 'Processing…',
    successPending: 'Check your email to confirm your subscription.',
    successAlready: 'This email is already registered. If confirmation is pending, check your inbox.',
    errorProcess: 'Your subscription could not be processed.',
    errorConnection: 'Could not connect to the server.',
    aboutDesc:
      'Non-profit international theatre organization providing artistic & educational opportunities for youth in Costa Rica, China, and Mozambique.',
    taglineBadge: 'Art Connecting Communities',
    contactUsBtn: 'Contact us',
    siteNav: 'Site Navigation',
    homeAndShows: 'Home & Shows',
    aboutImpact: 'History & Global Impact',
    shows: 'Theatrical Productions',
    internships: 'Internships & Volunteering',
    donations: 'Donations',
    globalFootprint: 'Global Footprint',
    contactAndInfo: 'Contact & Info',
    loadingContacts: 'Loading...',
    errorContacts: 'Contact information could not be loaded.',
    noContacts: 'No contact information is available.',
    copyright: '© 2026 Far Corners Community Theatre. All rights reserved.',
  },
  searchModal: {
    placeholder: 'Search shows, projects, communities, internships...',
    minChars: 'Type at least 2 characters to search.',
    searching: 'Searching...',
    noResults: 'No results found.',
    eventsAndShows: 'Events & Shows',
    projectsAndImpact: 'Projects & Impact',
    communities: 'Communities',
    opportunities: 'Opportunities',
    closeHint: 'Press ESC or X to close',
    errorQuery: 'The search could not be completed.',
  },
  auth: {
    registerTitle: 'Create an account',
    registerSubtitle: 'Be part of the Far Corners community.',
    fullName: 'Full name',
    fullNamePlaceholder: 'e.g. John Doe',
    email: 'Email address',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordHelp: 'Use between 10 and 128 characters. You can use a passphrase.',
    confirmPassword: 'Confirm password',
    createAccountBtn: 'Create account',
    creatingAccountBtn: 'Creating account…',
    orContinueWith: 'Or continue with',
    alreadyHaveAccount: 'Already have an account?',
    signInHere: 'Sign in here',
    googleSuccess: (name: string) => `Welcome ${name}! You signed in with Google.`,
    errors: {
      fullNameRequired: 'Please enter your full name.',
      passwordsDoNotMatch: 'Passwords do not match.',
      registerFailed: 'Unable to register account.',
      serverError: 'Could not connect to the server. Please try again.',
    },
    success: {
      accountCreated: 'Account created successfully. You can now sign in.',
    },
    loginTitle: 'Sign In',
    loginSubtitle: 'Sign in to your Far Corners account.',
    loginBtn: 'Sign in',
    loggingInBtn: 'Signing in…',
    noAccountYet: "Don't have an account?",
    registerHere: 'Register here',
  },
  modals: {
    volunteer: {
      title: 'Application Form',
      locationAndPeriod: 'Location & Period:',
      fullName: 'Full Name *',
      fullNamePlaceholder: 'e.g. Sofia Watson',
      email: 'Email Address *',
      country: 'Country of Residence *',
      countryPlaceholder: 'Costa Rica / USA...',
      experience: 'Experience / Motivation *',
      experiencePlaceholder: 'Tell us briefly about your theater/music background or your interest in joining...',
      attachCV: 'Attach Resume / CV (Optional)',
      attachCVPlaceholder: 'Click to select PDF or DOCX file',
      browseFile: 'Browse file',
      submitBtn: 'Submit Official Application',
      submittingBtn: 'Submitting application...',
      successTitle: 'Application Received!',
      successMessage: (name: string, roleTitle: string) =>
        `Thank you, ${name}. The Far Corners leadership team will review your application for the ${roleTitle} position.`,
      successEmailNotice: (email: string) =>
        `You will receive an email notification (${email}) to schedule a virtual interview.`,
      closeBtn: 'Got it',
    },
    ticket: {
      headerTitle: 'Official Far Corners Ticket Office',
      step1: 'Tickets & Date',
      step2: 'Patron Details',
      selectDate: 'Select Show Date:',
      quantity: 'Ticket Quantity:',
      total: 'Total Amount:',
      proceedToPatronInfo: 'Proceed to Patron Info',
      patronTitle: 'Patron Details',
      fullName: 'Full Name *',
      fullNamePlaceholder: 'e.g. Maria Rodriguez',
      email: 'Email Address *',
      phone: 'Phone Number *',
      paymentOption: 'Payment Option:',
      sinpeTitle: 'SINPE Movil (Costa Rica)',
      sinpeNumber: 'Official SINPE Movil Number:',
      sinpeInstructions: (crc: string) =>
        `Transfer ₡${crc} CRC to Far Corners Teatro Comunitario.`,
      sinpeRefLabel: 'SINPE Reference Number *',
      sinpeRefPlaceholder: 'e.g. #8920192',
      sinpeProofLabel: 'Attach Proof of Payment (Image or PDF) *',
      sinpeProofPlaceholder: 'Click to select proof of payment file',
      browseProof: 'Browse File',
      processingPurchase: 'Processing Purchase...',
      completeSinpeBtn: 'Complete SINPE Payment Registration',
      sinpeSuccessTitle: 'SINPE Receipt Received!',
      sinpeSuccessMsg: (crc: string, ref: string, email: string) =>
        `We have recorded your payment of ₡${crc} (Ref: ${ref}). Tickets were sent to ${email}.`,
      confirmedTitle: 'Reservation & Ticket Confirmed!',
      confirmedSubtitle: (email: string) =>
        `Confirmation and digital tickets were sent to ${email}.`,
      officialTicketBadge: 'OFFICIAL TICKET',
      ticketPatron: 'Patron:',
      ticketCount: (q: number) => `${q} x (General Admission)`,
      ticketDate: 'Date:',
      ticketTotal: 'Total:',
      yourTickets: 'Your Digital Tickets:',
      ticketItem: (index: number) => `Ticket #${index}`,
      qrCodeTitle: 'QR Access Code',
      qrCodeSubtitle: 'Show this code upon entering the theater',
      closeAndReturn: 'Close and Return',
    },
    donation: {
      title: 'Donate to Far Corners',
      subtitle: '100% goes to youth programs & community impact',
      selectAmount: 'Select Amount (USD):',
      customAmountPlaceholder: 'Custom amount ($ USD)...',
      paymentOption: 'Payment Option:',
      sinpeTitle: 'SINPE Movil (Costa Rica)',
      sinpeNumber: 'SINPE Movil Number:',
      sinpeInstructions: (amount: number | string) =>
        `Transfer the equivalent of $${amount} USD to Far Corners Teatro Comunitario.`,
      sinpeRefLabel: 'SINPE Reference Number (Optional):',
      sinpeRefPlaceholder: 'e.g. #8920192',
      zeffyTitle: 'Zeffy Payments Integration (0% Fee)',
      zeffySubtitle: '100% of your contribution goes directly to our scholarships and productions.',
      cardTitle: 'Secure SSL Stripe & PayPal Gateway',
      cardSubtitle: 'Direct processing with international cards.',
      donorName: 'Full Name *',
      donorNamePlaceholder: 'Your name...',
      donorEmail: 'Email Address *',
      completeDonationBtn: (amount: number | string) => `Complete Donation of $${amount} USD`,
      successTitle: 'Thank You for Your Support!',
      successMsg: (amount: number | string) =>
        `Your contribution of $${amount} USD supports musical theater scholarships and community productions.`,
      receiptNotice: (email: string) => `An official receipt will be sent to ${email}.`,
      closeBtn: 'Close',
    },
  },
  views: {
    home: {
      tagline: 'People, Stories, Community Through Art • Costa Rica',
      titleCommunity: 'Community Theatre',
      heroDescription:
        'People, Stories, Community Through Art. Creating stage experiences that empower youth and celebrate diversity.',
      buyTicketsBtn: 'Buy Tickets 2026',
      internshipBtn: 'Internship Opportunities',
      stats: {
        countries: 'Countries',
        showsProduced: 'Shows Produced',
        youthImpacted: 'Youth Impacted',
        scholarships: 'Social Scholarships',
      },
      nowPlaying: 'NOW PLAYING 2026',
      generalDirection: 'General Direction:',
      availableTickets: (count: number) => `${count} tickets available`,
      ticketPrice: 'Ticket Price:',
      reserveTicketsNow: 'Reserve Tickets Now',
      repertoryBadge: 'Production Archives',
      theatricalHistory: 'Our Theatrical History',
      viewFullCatalog: 'View full catalog',
      buyTickets: 'Buy Tickets',
      viewProgram: 'View program',
      presenceBadge: 'Global Outreach',
      projectsTitle: 'Projects in Costa Rica, China & Mozambique',
      projectsDesc:
        'Far Corners connects communities and opens spaces of expression through musical theatre.',
      ctaTitle: 'Ready to Join Our Journey?',
      ctaDesc:
        'Join as an international intern, cyber volunteer, or sponsor a young student scholarship.',
      applyInternship: 'Apply for Internship',
      makeDonation: 'Make a Donation',
    },
    about: {
      badge: 'Our Essence & Story',
      title: 'Our Story & Global Impact',
      desc:
        'Far Corners is a community theatre that believes in the power of art to transform, inspire, and unite people. We create stage experiences that strengthen community, celebrate diversity, and open spaces of expression for all.',
      originsTitle: 'History & Origins',
      geoReach: 'Geographic Reach',
      futureVision: 'Vision for the future',
    },
    shows: {
      badge: 'Theatrical Repertory 2026',
      title: 'Shows & Musical Productions',
      desc:
        'Explore the 2026 season productions and historical archive of Far Corners Community Theatre.',
      tab2026: '2026 Season',
      tabAll: 'All Shows',
      tabHistory: 'Historical Archive',
      buyTickets: 'Buy Tickets',
      viewProgram: 'View program',
    },
    participate: {
      badge: 'Programs & Opportunities',
      title: 'Join the Far Corners Family',
      desc:
        'Explore opportunities for local students, international university internships, and cyber/onsite volunteering.',
      campBadge: 'BILINGUAL SUMMER THEATRE CAMP',
      campTitle: 'Costa Rica Theatre Camp (CRTC)',
      campDesc:
        'A full immersion musical theatre camp in Monteverde, Costa Rica. Campers receive vocal, dance, and acting training culminating in a full musical.',
      campBullets: {
        ages: 'Ages: 8 to 18 years old',
        scholarships: '100% Local scholarships available',
        faculty: 'International bilingual faculty',
        shows: 'Mainstage public performances',
      },
      applyCampBtn: 'Apply for Theatre Camp 2026',
      openCallsBadge: 'Open Calls Summer 2026',
      openCallsTitle: 'Internships & Volunteering',
      applyRoleBtn: 'Apply for this Role',
    },
    contact: {
      title: 'Direct Contact',
      subtitle: 'Get in touch with our team in Costa Rica or internationally.',
      formTitle: 'Send us a Message',
      nameLabel: 'Full Name *',
      namePlaceholder: 'e.g. Daniel Zeas',
      emailLabel: 'Email Address *',
      emailPlaceholder: 'daniel@example.com',
      subjectLabel: 'Subject *',
      subjectPlaceholder: 'Internships / Tickets / Donations / Press...',
      messageLabel: 'Detailed Message *',
      messagePlaceholder: 'Write your inquiry or proposal here...',
      sendBtn: 'Send Message to Far Corners',
      sendingBtn: 'Sending Message...',
      successTitle: 'Message Sent Successfully!',
      successMsg: 'Thank you for reaching out. Our team will get back to you shortly.',
      sendAnotherBtn: 'Send another message',
      errorDefault: 'The message could not be sent.',
      channelsTitle: 'Official Support Channels',
      channelsSubtitle: 'Far Corners Headquarters & Contact Channels',
    },
    donate: {
      badge: 'Donations & Support',
      title: 'Donate to Far Corners',
      subtitle:
        'Your donation directly funds youth scholarships, costumes, props, and stage infrastructure in Costa Rica.',
      registerTitle: 'Register a Donation',
      registerSubtitle:
        'Select your payment method and enter the amount in USD ($) to make your contribution.',
      sinpeNumberTitle: 'Official SINPE Movil Number:',
      sinpeInstructions:
        'Transfer the equivalent of your USD donation to Far Corners Teatro Comunitario.',
      sinpeRefLabel: 'SINPE Reference Number (Optional):',
      sinpeRefPlaceholder: 'e.g. #8920192',
      zeffyTitle: 'Zeffy Payments (0% Fee)',
      zeffySubtitle:
        '100% free platform for non-profits. 100% of your donation directly funds programs.',
      cardTitle: 'Secure SSL Stripe & PayPal Gateway',
      cardSubtitle:
        'Secure direct processing with international credit or debit cards.',
      donorNameLabel: 'Donor Full Name *',
      donorNamePlaceholder: 'Your name...',
      donorEmailLabel: 'Email Address *',
      donorEmailPlaceholder: 'you@example.com',
      amountLabel: 'Donated Amount ($ USD Only) *',
      processingBtn: 'Processing Donation...',
      submitBtn: (amount: string) => `Complete Donation Registration ($${amount} USD)`,
      successTitle: 'Donation Successfully Registered!',
      successMsg: (name: string, amount: string) =>
        `Thank you ${name}. We recorded your contribution of $${amount} USD in our system.`,
      registerAnotherBtn: 'Register Another Donation',
    },
  },
};

export const translations: Record<Language, AppTranslations> = { es, en };

export function getTranslations(language: Language): AppTranslations {
  return translations[language] || translations.es;
}
