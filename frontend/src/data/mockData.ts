import { Show, ImpactProject, Opportunity, DonorTier, AuditLogItem, VolunteerApplication } from '../types';

export const showsData: Show[] = [
  {
    id: 'merlina-2026',
    title: 'Merlina (Wednesday Addams)',
    year: 2026,
    status: 'current',
    poster: '/recursos/IMG_2905.PNG',
    banner: '/recursos/IMG_2903.PNG',
    dates: '1 al 20 de Octubre, 2026',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 10000,
    priceVIP: 10000,
    priceStudent: 10000,
    availableTickets: 95,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: 'La oscura y fascinante comedia musical que sigue las aventuras de Merlina en la Academia Nunca Más, llena de misterio, humor y números musicales inolvidables.',
    synopsisEn: 'The dark and fascinating musical comedy following Wednesday Addams at Nevermore Academy, filled with mystery, humor, and catchy songs.',
    cast: [
      { name: 'Valentina Zeas', role: 'Merlina Addams' },
      { name: 'Sofia Rodríguez', role: 'Morticia Addams' },
      { name: 'Mateo Hernández', role: 'Homero Addams' }
    ]
  },
  {
    id: 'mamma-mia-2026',
    title: 'MAMMA MIA!',
    year: 2026,
    status: 'current',
    poster: '/recursos/IMG_2905.PNG',
    banner: '/recursos/IMG_2904.PNG',
    dates: '15 de Julio - 10 de Agosto, 2026',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 10000,
    priceVIP: 10000,
    priceStudent: 10000,
    availableTickets: 68,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: 'Una contagiosa comedia musical ambientada en una idílica isla griega, contada a través de las emblemáticas canciones de ABBA. Una historia sobre el amor, la amistad y la búsqueda de identidad.',
    synopsisEn: 'A funny and touching musical comedy set on a Greek island, told through ABBA iconic hits. A story about love, family, and identity.',
    cast: [
      { name: 'Sofía Rodríguez', role: 'Donna Sheridan' },
      { name: 'Mateo Hernández', role: 'Sam Carmichael' },
      { name: 'Valentina Zeas', role: 'Sophie Sheridan' },
      { name: 'Carlos Gómez', role: 'Bill Austin' }
    ]
  },
  {
    id: 'jesus-christ-superstar-2019',
    title: 'Jesus Christ Superstar',
    year: 2019,
    status: 'past',
    poster: '/recursos/IMG_2906.PNG',
    banner: '/recursos/IMG_2904.PNG',
    dates: 'Julio 2019',
    location: 'Teatro Monteverde, Puntarenas',
    priceGeneral: 8000,
    priceVIP: 8000,
    priceStudent: 8000,
    availableTickets: 0,
    director: 'Dirección Artística Far Corners',
    synopsis: 'Ópera rock legendaria que narra los últimos días de la vida de Jesús desde la perspectiva de Judas Iscariote, con impactantes arreglos vocales e instrumentales comunitarios.',
    synopsisEn: 'Legendary rock opera detailing the final days of Jesus Christ seen through Judas eyes, featuring striking community vocal arrangements.',
    cast: [
      { name: 'Daniel Zeas', role: 'Jesús de Nazaret' },
      { name: 'Ana Isabel Hernández', role: 'María Magdalena' }
    ]
  },
  {
    id: 'into-the-woods-2018',
    title: 'Into the Woods',
    year: 2018,
    status: 'past',
    poster: '/recursos/IMG_2908.PNG',
    banner: '/recursos/IMG_2907.PNG',
    dates: 'Julio 2018',
    location: 'Anfiteatro Monteverde, Costa Rica',
    priceGeneral: 8000,
    priceVIP: 8000,
    priceStudent: 8000,
    availableTickets: 0,
    director: 'Equipo Far Corners & Pasantes Internacionales',
    synopsis: 'La aclamada obra de Stephen Sondheim que entrelaza los cuentos de hadas clásicos de los Hermanos Grimm, explorando las consecuencias de nuestros deseos más profundos.',
    synopsisEn: 'Stephen Sondheim acclaimed musical intertwining Brothers Grimm fairy tales, exploring the consequences of our deepest wishes.',
    cast: [
      { name: 'Marcelo Gómez', role: 'El Panadero' },
      { name: 'Elena Ruiz', role: 'La Bruja' }
    ]
  },
  {
    id: 'fiddler-on-the-roof-2017',
    title: 'Fiddler on the Roof',
    year: 2017,
    status: 'past',
    poster: '/recursos/IMG_2910.PNG',
    banner: '/recursos/IMG_2909.PNG',
    dates: 'Julio 2017',
    location: 'Teatro Comunitario Monteverde',
    priceGeneral: 8000,
    priceVIP: 8000,
    priceStudent: 8000,
    availableTickets: 0,
    director: 'Far Corners International Crew',
    synopsis: 'Una emotiva historia sobre la tradición, la familia y el cambio en el pequeño pueblo de Anatevka a principios del siglo XX.',
    synopsisEn: 'A heartwarming story about tradition, family, and resilience in the village of Anatevka.',
    cast: [
      { name: 'Otto Segura', role: 'Tevye' },
      { name: 'Mariana Cordero', role: 'Golde' }
    ]
  },
  {
    id: 'les-miserables-2016',
    title: 'Les Misérables',
    year: 2016,
    status: 'past',
    poster: '/recursos/IMG_2912.PNG',
    banner: '/recursos/IMG_2911.PNG',
    dates: 'Julio 2016',
    location: 'Teatro Monteverde',
    priceGeneral: 8000,
    priceVIP: 8000,
    priceStudent: 8000,
    availableTickets: 0,
    director: 'Equipo Comunitario Far Corners',
    synopsis: 'La grandiosa épica de pasión y redención ambientada en la Francia del siglo XIX. Un hito en la historia del teatro comunitario de Monteverde.',
    synopsisEn: 'The epic musical of passion and redemption in 19th-century France. A milestone in Monteverde theatre history.',
    cast: [
      { name: 'Rafael Araya', role: 'Jean Valjean' },
      { name: 'Ana Hernández', role: 'Fantine' }
    ]
  }
];

export const projectsData: ImpactProject[] = [
  {
    id: 'proj-cr',
    title: 'Teatro Comunitario Monteverde',
    titleEn: 'Monteverde Community Theatre',
    country: 'Costa Rica',
    year: '2013 - Presente',
    summary: 'Sede principal de Far Corners. Campamento de verano bilingüe de artes escénicas donde jóvenes locales colaboran con pasantes de todo el mundo para montar un musical completo de nivel profesional.',
    summaryEn: 'Main hub of Far Corners. A bilingual summer performing arts camp where local youth collaborate with international interns to produce a full musical.',
    image: '/recursos/IMG_2915.PNG',
    participants: 1200,
    impactMetrics: [
      'Más de 15 musicales de gran escala producidos',
      'Becas del 100% para estudiantes locales de escasos recursos',
      'Más de 150 pasantes internacionales capacitados'
    ]
  },
  {
    id: 'proj-china',
    title: 'Iniciativa Teatral Educativa China',
    titleEn: 'China Educational Theatre Initiative',
    country: 'China',
    year: '2016 - 2019',
    summary: 'Talleres itinerantes de drama en inglés y teatro musical para estudiantes en zonas rurales de China, fomentando el desarrollo de la expresión oral, confianza y trabajo en equipo.',
    summaryEn: 'Traveling English drama and musical theatre workshops for students in rural China, building confidence and teamwork.',
    image: '/recursos/IMG_2918.PNG',
    participants: 850,
    impactMetrics: [
      'Talleres en 5 provincias rurales de China',
      'Intercambio cultural bilingüe en artes escénicas',
      'Capacitación pedagógica a profesores locales'
    ]
  },
  {
    id: 'proj-mozambique',
    title: 'Taller de Artes Escénicas Mozambique',
    titleEn: 'Mozambique Performing Arts Workshop',
    country: 'Mozambique',
    year: '2018 - Presente',
    summary: 'Programa de desarrollo artístico e intercambio cultural en Maputo y comunidades costeras, integrando danza tradicional, narración oral y música en vivo.',
    summaryEn: 'Artistic development and cultural exchange program in Maputo and coastal communities integrating dance, storytelling, and music.',
    image: '/recursos/IMG_2920.PNG',
    participants: 600,
    impactMetrics: [
      'Integración de ritmos tradicionales y teatro comunitario',
      'Construcción de instrumentos y utilería con materiales reciclados',
      'Red de jóvenes líderes culturales'
    ]
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
    details: 'Actualizado inventario de boletos para Merlina 2026 (95 disponibles)',
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

export const volunteerAppsMock: VolunteerApplication[] = [
  {
    id: 'APP-101',
    name: 'Emily Watson',
    email: 'emily.watson@university.edu',
    country: 'Estados Unidos',
    role: 'Pasantía: Stage Manager',
    status: 'En Revisión',
    date: '2026-10-05'
  },
  {
    id: 'APP-102',
    name: 'José Pablo Solano',
    email: 'j.solano@estudiantec.cr',
    country: 'Costa Rica',
    role: 'Voluntariado Cyber: Redes',
    status: 'Aprobado',
    date: '2026-10-04'
  }
];
