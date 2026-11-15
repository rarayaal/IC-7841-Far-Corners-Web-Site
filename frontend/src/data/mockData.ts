import { Show, ImpactProject, Opportunity, DonorTier, AuditLogItem } from '../types';

// Las fotos de `gallery` son copias optimizadas de public/obras. Cuando el bucket
// de R2 esté configurado pueden reemplazarse por las URLs públicas del bucket.
// `cast` vacío muestra «Elenco por anunciar»: no se inventan nombres.
export const showsData: Show[] = [
  {
    id: 'addams-family-2026',
    title: 'THE ADDAMS FAMILY MUSICAL',
    year: 2026,
    status: 'current',
    poster: '/obras/addams-2026/addams-2026-01.jpg',
    banner: '/obras/addams-2026/addams-2026-02.jpg',
    dates: '1 al 20 de octubre, 2026',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 10000,
    priceVIP: 10000,
    priceStudent: 10000,
    availableTickets: 95,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: "En este divertido y macabro musical, la famosa y espeluznante Familia Addams se enfrenta a una nueva pesadilla. Miércoles, convertida ya en una joven, se ha enamorado de un chico dulce y \"normal\" de Ohio. Ambas familias se reúnen para una cena fatídica, poniendo a prueba los lazos del amor y la herencia frente a sus mundos radicalmente diferentes.",
    synopsisEn: "In this hilarious and macabre musical, the famously spooky Addams Family faces a new nightmare. Daughter Wednesday, now a young woman, has fallen in love with a sweet, \"normal\" young man from Ohio. The two families meet for a fateful dinner party, testing the bonds of love and heritage against their drastically different worlds.",
    cast: [],
    gallery: ['/obras/addams-2026/addams-2026-01.jpg', '/obras/addams-2026/addams-2026-02.jpg', '/obras/addams-2026/addams-2026-03.jpg', '/obras/addams-2026/addams-2026-04.jpg', '/obras/addams-2026/addams-2026-05.jpg', '/obras/addams-2026/addams-2026-06.jpg', '/obras/addams-2026/addams-2026-07.jpg', '/obras/addams-2026/addams-2026-08.jpg']
  },
  {
    id: 'mamma-mia-2024',
    title: 'MAMMA MIA!',
    year: 2024,
    status: 'past',
    poster: '/obras/mamma-mia-2024/mamma-mia-2024-01.jpg',
    banner: '/obras/mamma-mia-2024/mamma-mia-2024-02.jpg',
    dates: '2024',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 10000,
    priceVIP: 10000,
    priceStudent: 10000,
    availableTickets: 0,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: "Una contagiosa comedia musical ambientada en una idílica isla griega, contada a través de las emblemáticas canciones de ABBA. Una historia sobre el amor, la amistad y la búsqueda de identidad.",
    synopsisEn: "A contagious musical comedy set on an idyllic Greek island, told through ABBA's iconic songs. A story about love, friendship, and the search for identity.",
    cast: [
      { name: 'Noelyn Santamaría', role: 'Donna' },
      { name: 'Jackie Vargas', role: 'Sophie' }
    ],
    gallery: ['/obras/mamma-mia-2024/mamma-mia-2024-01.jpg', '/obras/mamma-mia-2024/mamma-mia-2024-02.jpg', '/obras/mamma-mia-2024/mamma-mia-2024-03.jpg', '/obras/mamma-mia-2024/mamma-mia-2024-04.jpg', '/obras/mamma-mia-2024/mamma-mia-2024-05.jpg', '/obras/mamma-mia-2024/mamma-mia-2024-06.jpg', '/obras/mamma-mia-2024/mamma-mia-2024-07.jpg', '/obras/mamma-mia-2024/mamma-mia-2024-08.jpg']
  },
  {
    id: 'jesus-christ-superstar-2022',
    title: 'Jesus Christ Superstar',
    year: 2022,
    status: 'past',
    poster: '/obras/jcs-2022/jcs-2022-01.jpg',
    banner: '/obras/jcs-2022/jcs-2022-02.jpg',
    dates: '2022',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 8000,
    priceVIP: 8000,
    priceStudent: 8000,
    availableTickets: 0,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: "Ópera rock legendaria que narra los últimos días de la vida de Jesús desde la perspectiva de Judas Iscariote, con impactantes arreglos vocales e instrumentales comunitarios.",
    synopsisEn: "A legendary rock opera narrating the final days of Jesus' life from the perspective of Judas Iscariot, featuring impactful community vocal and instrumental arrangements.",
    cast: [],
    gallery: ['/obras/jcs-2022/jcs-2022-01.jpg', '/obras/jcs-2022/jcs-2022-02.jpg', '/obras/jcs-2022/jcs-2022-03.jpg', '/obras/jcs-2022/jcs-2022-04.jpg', '/obras/jcs-2022/jcs-2022-05.jpg', '/obras/jcs-2022/jcs-2022-06.jpg', '/obras/jcs-2022/jcs-2022-07.jpg', '/obras/jcs-2022/jcs-2022-08.jpg']
  },
  {
    id: 'into-the-woods',
    title: 'Into the Woods',
    year: 2019,
    status: 'past',
    poster: '/obras/into-the-woods/into-the-woods-01.jpg',
    banner: '/obras/into-the-woods/into-the-woods-02.jpg',
    dates: '2019',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 8000,
    priceVIP: 8000,
    priceStudent: 8000,
    availableTickets: 0,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: "El musical de Stephen Sondheim que entrelaza cuentos de hadas clásicos y explora las consecuencias de nuestros deseos más profundos.",
    synopsisEn: "Stephen Sondheim's musical interweaving classic fairy tales and exploring the consequences of our deepest wishes.",
    cast: [],
    gallery: ['/obras/into-the-woods/into-the-woods-01.jpg', '/obras/into-the-woods/into-the-woods-02.jpg', '/obras/into-the-woods/into-the-woods-03.jpg', '/obras/into-the-woods/into-the-woods-04.jpg', '/obras/into-the-woods/into-the-woods-05.jpg', '/obras/into-the-woods/into-the-woods-06.jpg', '/obras/into-the-woods/into-the-woods-07.jpg', '/obras/into-the-woods/into-the-woods-08.jpg']
  },
  {
    id: 'fiddler-on-the-roof-2017',
    title: 'Fiddler on the Roof',
    year: 2017,
    status: 'past',
    poster: '/obras/fiddler-2017/fiddler-2017-01.jpg',
    banner: '/obras/fiddler-2017/fiddler-2017-02.jpg',
    dates: '2017',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 8000,
    priceVIP: 8000,
    priceStudent: 8000,
    availableTickets: 0,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: "Una emotiva historia sobre la tradición, la familia y el cambio en el pequeño pueblo de Anatevka a principios del siglo XX.",
    synopsisEn: "A heartwarming story about tradition, family, and change in the village of Anatevka.",
    cast: [],
    gallery: ['/obras/fiddler-2017/fiddler-2017-01.jpg', '/obras/fiddler-2017/fiddler-2017-02.jpg', '/obras/fiddler-2017/fiddler-2017-03.jpg', '/obras/fiddler-2017/fiddler-2017-04.jpg', '/obras/fiddler-2017/fiddler-2017-05.jpg', '/obras/fiddler-2017/fiddler-2017-06.jpg', '/obras/fiddler-2017/fiddler-2017-07.jpg', '/obras/fiddler-2017/fiddler-2017-08.jpg']
  },
  {
    id: 'in-the-heights-2013',
    title: 'In the Heights',
    year: 2013,
    status: 'past',
    poster: '/obras/in-the-heights-2013/in-the-heights-2013-01.jpg',
    banner: '/obras/in-the-heights-2013/in-the-heights-2013-02.jpg',
    dates: '2013',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 8000,
    priceVIP: 8000,
    priceStudent: 8000,
    availableTickets: 0,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: "Un musical sobre la vida, los sueños y la comunidad de un barrio latino de Nueva York.",
    synopsisEn: "A musical about the life, dreams and community of a Latino neighborhood in New York.",
    cast: [],
    gallery: ['/obras/in-the-heights-2013/in-the-heights-2013-01.jpg', '/obras/in-the-heights-2013/in-the-heights-2013-02.jpg', '/obras/in-the-heights-2013/in-the-heights-2013-03.jpg', '/obras/in-the-heights-2013/in-the-heights-2013-04.jpg', '/obras/in-the-heights-2013/in-the-heights-2013-05.jpg', '/obras/in-the-heights-2013/in-the-heights-2013-06.jpg', '/obras/in-the-heights-2013/in-the-heights-2013-07.jpg', '/obras/in-the-heights-2013/in-the-heights-2013-08.jpg']
  },
  {
    id: 'urinetown-2009',
    title: 'Urinetown',
    year: 2009,
    status: 'past',
    poster: '/obras/urinetown-2009/urinetown-2009-01.jpg',
    banner: '/obras/urinetown-2009/urinetown-2009-02.jpg',
    dates: '2009',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 8000,
    priceVIP: 8000,
    priceStudent: 8000,
    availableTickets: 0,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: "Una sátira musical sobre la escasez de agua, la codicia y la rebelión de un pueblo.",
    synopsisEn: "A musical satire about water scarcity, greed and a town's rebellion.",
    cast: [],
    gallery: ['/obras/urinetown-2009/urinetown-2009-01.jpg', '/obras/urinetown-2009/urinetown-2009-02.jpg', '/obras/urinetown-2009/urinetown-2009-03.jpg', '/obras/urinetown-2009/urinetown-2009-04.jpg', '/obras/urinetown-2009/urinetown-2009-05.jpg', '/obras/urinetown-2009/urinetown-2009-06.jpg', '/obras/urinetown-2009/urinetown-2009-07.jpg']
  },
  {
    id: 'guys-and-dolls-2005',
    title: 'Guys & Dolls',
    year: 2005,
    status: 'past',
    poster: '/obras/guys-and-dolls-2005/guys-and-dolls-2005-01.jpg',
    banner: '/obras/guys-and-dolls-2005/guys-and-dolls-2005-02.jpg',
    dates: '2005',
    location: 'Teatro Comunitario Monteverde, Costa Rica',
    priceGeneral: 8000,
    priceVIP: 8000,
    priceStudent: 8000,
    availableTickets: 0,
    director: 'Equipo Far Corners Teatro Comunitario',
    synopsis: "La comedia musical clásica de apuestas, enredos y romance en Nueva York.",
    synopsisEn: "The classic musical comedy of gamblers, mix-ups and romance in New York.",
    cast: [],
    gallery: ['/obras/guys-and-dolls-2005/guys-and-dolls-2005-01.jpg', '/obras/guys-and-dolls-2005/guys-and-dolls-2005-02.jpg', '/obras/guys-and-dolls-2005/guys-and-dolls-2005-03.jpg', '/obras/guys-and-dolls-2005/guys-and-dolls-2005-04.jpg']
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
    gallery: ['/obras/mamma-mia-2024/mamma-mia-2024-01.jpg', '/obras/addams-2026/addams-2026-02.jpg', '/obras/jcs-2022/jcs-2022-03.jpg']
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
