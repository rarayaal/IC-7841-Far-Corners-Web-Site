import { Show, ImpactProject, Opportunity, DonorTier, AuditLogItem } from '../types';

// Las fotos de `gallery` son marcadores con los recursos disponibles; se
// reemplazan por las fotos reales de cada producción cuando estén listas.
// `cast` vacío muestra «Elenco por anunciar»: no se inventan nombres.
export const showsData: Show[] = [
  {
    id: 'addams-family-2026',
    title: 'THE ADDAMS FAMILY MUSICAL',
    year: 2026,
    status: 'current',
    poster: '/recursos/IMG_2905.PNG',
    banner: '/recursos/IMG_2903.PNG',
    dates: '1 al 20 de octubre, 2026',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 10000,
    priceVIP: 10000,
    priceStudent: 10000,
    availableTickets: 95,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: 'En este divertido y macabro musical, la famosa y espeluznante Familia Addams se enfrenta a una nueva pesadilla. Miércoles, convertida ya en una joven, se ha enamorado de un chico dulce y "normal" de Ohio. Ambas familias se reúnen para una cena fatídica, poniendo a prueba los lazos del amor y la herencia frente a sus mundos radicalmente diferentes.',
    synopsisEn: 'In this hilarious and macabre musical, the famously spooky Addams Family faces a new nightmare. Daughter Wednesday, now a young woman, has fallen in love with a sweet, "normal" young man from Ohio. The two families meet for a fateful dinner party, testing the bonds of love and heritage against their drastically different worlds.',
    cast: [],
    gallery: ['/recursos/IMG_2905.PNG', '/recursos/IMG_2903.PNG']
  },
  {
    id: 'mamma-mia-2024',
    title: 'MAMMA MIA!',
    year: 2024,
    status: 'past',
    poster: '/recursos/IMG_2905.PNG',
    banner: '/recursos/IMG_2904.PNG',
    dates: '2024',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 10000,
    priceVIP: 10000,
    priceStudent: 10000,
    availableTickets: 0,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: 'Una contagiosa comedia musical ambientada en una idílica isla griega, contada a través de las emblemáticas canciones de ABBA. Una historia sobre el amor, la amistad y la búsqueda de identidad.',
    synopsisEn: "A contagious musical comedy set on an idyllic Greek island, told through ABBA's iconic songs. A story about love, friendship, and the search for identity.",
    cast: [
      { name: 'Noelyn Santamaría', role: 'Donna' },
      { name: 'Jackie Vargas', role: 'Sophie' }
    ],
    gallery: ['/recursos/IMG_2904.PNG', '/recursos/IMG_2905.PNG']
  },
  {
    id: 'jesus-christ-superstar-2019',
    title: 'Jesus Christ Superstar',
    year: 2019,
    status: 'past',
    poster: '/recursos/IMG_2906.PNG',
    banner: '/recursos/IMG_2904.PNG',
    dates: 'Julio 2019',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 8000,
    priceVIP: 8000,
    priceStudent: 8000,
    availableTickets: 0,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: 'Ópera rock legendaria que narra los últimos días de la vida de Jesús desde la perspectiva de Judas Iscariote, con impactantes arreglos vocales e instrumentales comunitarios.',
    synopsisEn: "A legendary rock opera narrating the final days of Jesus' life from the perspective of Judas Iscariot, featuring impactful community vocal and instrumental arrangements.",
    cast: [],
    gallery: ['/recursos/IMG_2906.PNG', '/recursos/IMG_2904.PNG']
  }
];

export const projectsData: ImpactProject[] = [
  {
    id: 'proj-cr',
    title: 'Teatro Comunitario Monteverde',
    titleEn: 'Monteverde Community Theatre',
    country: 'Costa Rica',
    year: '2005 - Presente',
    summary: 'Actividad extracurricular bienal de artes escénicas en Monteverde, donde jóvenes y adultos de la comunidad colaboran con voluntarios y pasantes de todo el mundo para montar un musical comunitario. La coordinación de programas se encuentra en Monteverde.',
    summaryEn: 'A biennial extracurricular performing arts activity in Monteverde where young people and adults from the community work with volunteers and interns from around the world to stage a community musical. Program coordination is based in Monteverde.',
    image: '/recursos/IMG_2915.PNG',
    participants: 1200,
    impactMetrics: [
      'Más de 15 producciones de teatro musical comunitario',
      'Acceso comunitario 100% libre para participantes locales',
      'Más de 150 pasantes internacionales capacitados'
    ],
    gallery: ['/recursos/IMG_2915.PNG', '/recursos/IMG_2916.PNG', '/recursos/IMG_2917.PNG']
  }
];

export const opportunitiesData: Opportunity[] = [
  {
    id: 'opp-camp',
    title: 'Costa Rica Theatre Camp (Estudiantes)',
    titleEn: 'Costa Rica Theatre Camp (Students)',
    type: 'camp',
    location: 'Monteverde, Puntarenas, Costa Rica',
    period: 'Junio - Agosto 2026',
    description: 'Campamento intensivo de teatro musical para jóvenes de 8 a 18 años. Clases diarias de canto, actuación, danza y montaje de la obra principal con profesores internacionales.',
    descriptionEn: 'Intensive summer musical theatre camp for youth ages 8 to 18. Daily classes in singing, acting, and dance.',
    requirements: [
      'Edades entre 8 y 18 años',
      'Interés en artes escénicas (no se requiere experiencia previa)',
      'Compromiso de asistencia a todos los ensayos'
    ],
    requirementsEn: [
      'Ages 8 to 18',
      'Interest in performing arts',
      'Commitment to all rehearsals'
    ]
  },
  {
    id: 'opp-intern-stage',
    title: 'Pasantía Internacional: Stage Manager / Dirección',
    titleEn: 'International Internship: Stage Management & Directing',
    type: 'internship',
    location: 'Monteverde, Costa Rica',
    period: 'Temporada Verano 2026 (7 semanas)',
    description: 'Buscamos estudiantes universitarios y jóvenes profesionales internacionales apasionados por la gestión escénica, dirección de escena y logística de producción teatral.',
    descriptionEn: 'We are seeking international university students and young professionals for stage management and production.',
    requirements: [
      'Estudiante o graduado en Teatro, Gestión Cultural o áreas afines',
      'Nivel de inglés intermedio/avanzado',
      'Capacidad de trabajo colaborativo multicultural'
    ],
    requirementsEn: [
      'Theatre or Cultural Management background',
      'Intermediate/Advanced English proficiency',
      'Cross-cultural teamwork skills'
    ]
  },
  {
    id: 'opp-intern-vocal',
    title: 'Pasantía: Coach Vocal y Dirección Musical',
    titleEn: 'Internship: Vocal Coach & Musical Direction',
    type: 'internship',
    location: 'Monteverde, Costa Rica',
    period: 'Verano 2026',
    description: 'Liderar el entrenamiento vocal de niños y jóvenes del campamento, ensayar coros y preparar los solos para el musical principal.',
    descriptionEn: 'Lead vocal training for youth campers, rehearse choruses, and prepare solo numbers.',
    requirements: [
      'Formación en música, canto o piano',
      'Experiencia previa en dirección de coros o paridad vocal',
      'Deseo de enseñar a jóvenes en entorno bilingüe'
    ],
    requirementsEn: [
      'Background in music, singing, or piano',
      'Experience directing choirs or vocal ensembles',
      'Desire to teach youth in a bilingual setting'
    ]
  },
  {
    id: 'opp-cyber-vol',
    title: 'Voluntariado Cyber: Redes y Medios Digitales',
    titleEn: 'Cyber Volunteer: Social Media & Digital Content',
    type: 'volunteer',
    location: 'Remoto (Cualquier país)',
    period: 'Continuo / Flexibilidad de horarios',
    description: 'Apoya a nuestra organización desde cualquier lugar del mundo diseñando afiches, editando videos, creando piezas de comunicación y gestionando redes sociales.',
    descriptionEn: 'Support our organization remotely by creating social graphics, editing video footage, and writing newsletter updates.',
    requirements: [
      'Conocimientos de diseño gráfico (Canva, Photoshop) o edición de video',
      'Disponibilidad de 3-5 horas semanales',
      'Compromiso con la misión social del teatro'
    ],
    requirementsEn: [
      'Graphic design or video editing skills',
      'Availability of 3-5 hours per week',
      'Commitment to social theatre mission'
    ]
  }
];

export const donorTiersData: DonorTier[] = [];

export const auditLogsMock: AuditLogItem[] = [
  {
    id: 'LOG-8901',
    user: 'Alicia Salazar (Admin General)',
    action: 'UPDATE',
    module: 'Boletería',
    details: 'Actualizado inventario de boletos para The Addams Family Musical 2026 (95 disponibles)',
    timestamp: '2026-10-09 14:32:05'
  },
  {
    id: 'LOG-8902',
    user: 'Rafael Araya (Admin)',
    action: 'CREATE',
    module: 'Oportunidades',
    details: 'Creada nueva posición de pasantía: Coach Vocal Verano 2026',
    timestamp: '2026-10-08 11:15:40'
  },
  {
    id: 'LOG-8903',
    user: 'Ana Hernández (Admin Medios)',
    action: 'UPDATE',
    module: 'Contenido Institucional',
    details: 'Actualizada visión e impacto en Costa Rica Monteverde',
    timestamp: '2026-10-07 09:50:12'
  }
];
