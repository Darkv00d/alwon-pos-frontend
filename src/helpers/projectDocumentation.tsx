import { appConfig } from './config';

// --- TYPE DEFINITIONS ---

export type ProjectFeature = {
  name: string;
  description: string;
};

export type ProjectModule = {
  name: string;
  description: string;
  keyFunctionalities: string[];
  relatedPages: { path: string; description: string }[];
};

export type ApiEndpoint = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  requestSchema?: string;
  responseSchema?: string;
  isProtected: boolean;
};

export type TechStackItem = {
  name: string;
  version?: string;
  purpose: string;
};

export type DevelopmentGuideline = {
  topic: string;
  points: string[];
};

export type TroubleshootingItem = {
  problem: string;
  solution: string;
};

export type RoadmapItem = {
  feature: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
};

export type PriceCalculationDoc = {
  overview: string;
  endpoint: {
    title: string;
    input: string[];
    output: string[];
    authentication: string;
  };
  hooks: {
    name: string;
    description: string;
    example: string;
  }[];
  component: {
    name: string;
    description: string;
    example: string;
  };
  useCases: {
    context: string;
    applications: string[];
  }[];
  integration: {
    title: string;
    steps: string[];
    fullExample: string;
  };
};

export type ProjectDocumentationStructure = {
  projectInfo: {
    name: string;
    description: string;
    version: string;
    features: ProjectFeature[];
  };
  flootArchitecture: {
    introduction: string;
    primitives: {
      name: 'Pages' | 'Components' | 'Helpers' | 'Endpoints';
      description: string;
      structure: string;
    }[];
  };
  implementedFunctionalities: {
    module: string;
    features: string[];
  }[];
  projectStructure: {
    directory: string;
    description: string;
  }[];
  technologies: TechStackItem[];
  configuredResources: {
    secrets: { name: string; description: string }[];
    database: string;
  };
  mainModules: Record<string, ProjectModule>;
  apiEndpoints: ApiEndpoint[];
  priceCalculationGuide: PriceCalculationDoc;
  developmentGuide: DevelopmentGuideline[];
  deploymentProcess: {
    title: string;
    steps: string[];
  };
  troubleshooting: TroubleshootingItem[];
  roadmap: RoadmapItem[];
};

// --- DOCUMENTATION DATA ---

export const projectDocumentation: ProjectDocumentationStructure = {
  projectInfo: {
    name: 'Alwon POS',
    version: '1.0.0',
    description:
      'Solución de minimarkets de autoservicio para edificios residenciales, con un POS intuitivo para gestionar inventarios, proveedores, órdenes de compra automatizadas, y una interfaz de quiosco de autoservicio.',
    features: [
      { name: 'Gestión de Inventario', description: 'Control de stock en tiempo real, gestión de lotes y sugerencias de reabastecimiento.' },
      { name: 'Punto de Venta (POS)', description: 'Interfaz de quiosco de autoservicio y terminal de ventas para operadores.' },
      { name: 'Gestión de Personal (Workforce)', description: 'Control de horarios (Time Clock), gestión de ausencias y configuración de nómina.' },
      { name: 'Gestión de Clientes y Lealtad', description: 'Base de datos de clientes con programa de puntos de lealtad integrado.' },
      { name: 'Logística y Entregas', description: 'Planificación de rutas y gestión de vehículos para operaciones de entrega.' },
      { name: 'Panel de Administración', description: 'Control centralizado sobre usuarios, roles, ubicaciones, catálogos y utilidades del sistema.' },
    ],
  },
  flootArchitecture: {
    introduction:
      'Alwon POS está construido sobre el framework Floot, que organiza el código en cuatro tipos de primitivas para una clara separación de responsabilidades y un desarrollo eficiente.',
    primitives: [
      {
        name: 'Pages',
        description: 'Componentes de React que actúan como puntos de entrada para las rutas de la aplicación. Definen la estructura de una URL específica.',
        structure: 'pages/<name>.tsx, pages/<name>.module.css, pages/<name>.pageLayout.tsx',
      },
      {
        name: 'Components',
        description: 'Bloques de construcción de UI reutilizables, como botones, formularios o tablas. No están atados a ninguna ruta específica.',
        structure: 'components/<name>.tsx, components/<name>.module.css',
      },
      {
        name: 'Helpers',
        description: 'Funciones de utilidad, hooks de React, constantes, tipos, o cualquier código que no sea visual. Contienen la lógica de negocio y el estado.',
        structure: 'helpers/<name>.tsx',
      },
      {
        name: 'Endpoints',
        description: 'Funciones del lado del servidor que manejan las peticiones HTTP (API). Aquí es donde reside la lógica de backend segura.',
        structure: 'endpoints/<name>.ts, endpoints/<name>.schema.ts',
      },
    ],
  },
  implementedFunctionalities: [
    {
      module: 'Admin',
      features: [
        'Dashboard principal con navegación a módulos clave.',
        'Gestión completa de usuarios y roles con permisos por módulo.',
        'Gestión de catálogos: creación y visualización de categorías y subcategorías.',
        'Gestión de ubicaciones de inventario y de puntos de venta (POS).',
        'Hub central de inventario para acceder a ajustes, transferencias y Kardex.',
        'Utilidades del sistema para mantenimiento de la base de datos.',
        'Documentación de variables de entorno integrada en la UI.',
        'Interfaz de despliegue automatizado con checklists y logs.',
      ],
    },
    {
      module: 'POS',
      features: [
        'Interfaz de quiosco de autoservicio para clientes.',
        'Búsqueda de productos en tiempo real.',
        'Carrito de compras interactivo con validación de stock.',
        'Integración con programa de lealtad para buscar clientes y acumular puntos.',
        'Procesamiento de transacciones con múltiples métodos de pago.',
      ],
    },
    {
      module: 'Inventario',
      features: [
        'Dashboard de inventario con gestión de productos y proveedores.',
        'Gestión de lotes de productos con fechas de vencimiento.',
        'Visualización de movimientos de stock (Kardex) con filtros avanzados.',
        'Formularios para ajustes y transferencias de inventario.',
      ],
    },
    {
      module: 'Workforce',
      features: [
        'Dashboard de personal con estado de vehículos y rutas.',
        'Gestión de empleados (CRUD).',
        'Gestión de solicitudes de ausencia con vistas de lista y calendario.',
        'Quiosco de fichaje (Time Clock) para empleados.',
        'Configuración de reglas de horas extra y feriados.',
      ],
    },
    {
      module: 'Clientes',
      features: [
        'Gestión de clientes (CRUD).',
        'Administración manual de puntos de lealtad.',
        'Configuración de las reglas del programa de lealtad.',
      ],
    },
  ],
  projectStructure: [
    { directory: 'components/', description: 'Componentes de UI reutilizables (ej. Button, Form, Table).' },
    { directory: 'pages/', description: 'Puntos de entrada para cada ruta de la aplicación (ej. /admin, /pos).' },
    { directory: 'helpers/', description: 'Lógica no visual, hooks, tipos, y utilidades (ej. useAuth, config).' },
    { directory: 'endpoints/', description: 'API del backend, lógica del servidor (ej. auth/session_GET).' },
  ],
  technologies: [
    { name: 'React', version: '^19.0.0', purpose: 'Librería principal para la construcción de la interfaz de usuario.' },
    { name: 'TypeScript', purpose: 'Superset de JavaScript que añade tipado estático para mayor robustez.' },
    { name: 'TanStack Query (React Query)', version: '^5.76.1', purpose: 'Gestión del estado del servidor, fetching de datos, caching y mutaciones.' },
    { name: 'Zod', version: '^3.24.2', purpose: 'Validación de esquemas para datos de formularios y APIs.' },
    { name: 'React Hook Form', version: '^7.54.2', purpose: 'Manejo de formularios complejos con validación.' },
    { name: 'Kysely', version: '0.26.3', purpose: 'Type-safe SQL query builder para la interacción con la base de datos en el backend.' },
    { name: 'Lucide React', version: '^0.477.0', purpose: 'Librería de iconos SVG ligera y personalizable.' },
    { name: 'CSS Modules', purpose: 'Sistema de estilos con alcance local para evitar colisiones de clases.' },
  ],
  configuredResources: {
    secrets: [
      { name: 'DATABASE_URL', description: 'URL de conexión a la base de datos PostgreSQL.' },
      { name: 'JWT_SECRET', description: 'Secreto para firmar los JSON Web Tokens de sesión.' },
      { name: 'CLOUDINARY_URL', description: 'URL de configuración para el servicio de almacenamiento de imágenes Cloudinary.' },
    ],
    database: 'PostgreSQL. El esquema está definido y es accesible a través del helper `helpers/schema.tsx` usando Kysely.',
  },
  mainModules: {
    admin: {
      name: 'Panel de Administración',
      description: 'Módulo central para la configuración y gestión de todo el sistema.',
      keyFunctionalities: ['Gestión de Usuarios y Roles', 'Configuración de POS', 'Gestión de Catálogo', 'Utilidades del Sistema'],
      relatedPages: [
        { path: '/admin', description: 'Dashboard principal de administración.' },
        { path: '/admin/usuarios-completo', description: 'Hub de gestión de usuarios y seguridad.' },
        { path: '/admin/inventario', description: 'Hub de gestión de inventario.' },
        { path: '/admin/deployment', description: 'Interfaz para despliegues automatizados.' },
      ],
    },
    pos: {
      name: 'Punto de Venta (POS)',
      description: 'Interfaces para transacciones de venta, tanto para clientes como para operadores.',
      keyFunctionalities: ['Quiosco de Autoservicio', 'Procesamiento de Pagos', 'Integración de Lealtad'],
      relatedPages: [{ path: '/pos', description: 'Interfaz del quiosco de autoservicio.' }],
    },
    inventory: {
      name: 'Gestión de Inventario',
      description: 'Control de stock, productos, proveedores y movimientos de inventario.',
      keyFunctionalities: ['Gestión de Productos', 'Gestión de Proveedores', 'Control de Lotes', 'Movimientos de Stock (Kardex)'],
      relatedPages: [
        { path: '/inventory', description: 'Dashboard de inventario.' },
        { path: '/inventory/lots', description: 'Gestión de lotes de productos.' },
        { path: '/inventory/movements', description: 'Historial de movimientos de stock.' },
      ],
    },
    workforce: {
      name: 'Gestión de Personal',
      description: 'Herramientas para la administración de empleados, horarios y nómina.',
      keyFunctionalities: ['Gestión de Empleados', 'Control de Horarios (Time Clock)', 'Gestión de Ausencias', 'Configuración de Nómina'],
      relatedPages: [
        { path: '/workforce', description: 'Dashboard de personal.' },
        { path: '/workforce/employees', description: 'Gestión de la lista de empleados.' },
        { path: '/timeclock', description: 'Quiosco de fichaje para empleados.' },
      ],
    },
  },
  apiEndpoints: [
    {
      path: '/_api/products/calculate-price',
      method: 'POST',
      description: 'Calcula el precio de un producto con promociones aplicadas.',
      requestSchema: 'productId, quantity, locationId?, channel?, customerId?, couponCode?',
      responseSchema: 'basePrice, finalPrice, discount, appliedPromotions[]',
      isProtected: true,
    },
    {
      path: '/_api/auth/session',
      method: 'GET',
      description: 'Obtiene la información del usuario de la sesión actual.',
      isProtected: true,
    },
    {
      path: '/_api/auth/logout',
      method: 'POST',
      description: 'Cierra la sesión del usuario actual.',
      isProtected: true,
    },
    {
      path: '/_api/auth/login',
      method: 'POST',
      description: 'Autentica a un usuario con email y contraseña.',
      requestSchema: 'email, password',
      isProtected: false,
    },
    {
      path: '/_api/admin/users/list',
      method: 'GET',
      description: 'Obtiene la lista de todos los usuarios del sistema.',
      isProtected: true,
    },
    {
      path: '/_api/admin/products/import',
      method: 'POST',
      description: 'Realiza una importación masiva de productos desde un archivo CSV.',
      isProtected: true,
    },
    {
      path: '/_api/transactions',
      method: 'POST',
      description: 'Crea una nueva transacción de venta.',
      isProtected: true,
    },
  ],
  priceCalculationGuide: {
    overview:
      'El sistema de cálculo de precios permite obtener el precio de productos con todas las promociones aplicadas automáticamente. Incluye endpoint, hooks React Query y componente visual.',
    endpoint: {
      title: 'POST /products/calculate-price',
      input: [
        'productId: ID del producto (requerido)',
        'quantity: Cantidad a calcular (requerido)',
        'locationId: ID de ubicación (opcional)',
        'channel: Canal de venta - pos, kiosk, online, wholesale (opcional)',
        'customerId: ID del cliente (opcional)',
        'couponCode: Código de cupón (opcional)',
      ],
      output: [
        'basePrice: Precio base sin descuentos',
        'finalPrice: Precio final con descuentos aplicados',
        'discount: Monto total de descuento',
        'appliedPromotions[]: Array de promociones aplicadas con detalles',
      ],
      authentication: 'Requerida',
    },
    hooks: [
      {
        name: 'usePriceCalculationMutation',
        description:
          'Para cálculos puntuales. Ideal cuando se necesita calcular el precio en respuesta a una acción del usuario.',
        example: `const { mutateAsync, isPending } = usePriceCalculationMutation();

const handleCalculate = async () => {
  const result = await mutateAsync({
    productId: 123,
    quantity: 2,
    locationId: 1,
    channel: 'pos'
  });
  
  if (result.success) {
    console.log('Precio final:', result.data.finalPrice);
    console.log('Descuento:', result.data.discount);
  }
};`,
      },
      {
        name: 'useProductPriceQuery',
        description:
          'Para precios en tiempo real. Se actualiza automáticamente cuando cambian los parámetros.',
        example: `const { data, isFetching } = useProductPriceQuery({
  productId: 123,
  quantity: 2,
  locationId: 1,
  channel: 'kiosk',
  customerId: 456
});

// El precio se actualiza automáticamente al cambiar productId o quantity`,
      },
    ],
    component: {
      name: 'ProductPriceDisplay',
      description:
        'Componente visual que muestra precios con descuentos. Soporta vista compacta y vista detallada con desglose de promociones.',
      example: `<ProductPriceDisplay
  productId={product.id}
  quantity={qty}
  locationId={currentLocation}
  channel="pos"
  customerId={customer?.id}
  showBreakdown={true} // Muestra desglose de promociones
/>`,
    },
    useCases: [
      {
        context: 'POS',
        applications: [
          'Mostrar precio de productos al seleccionarlos',
          'Calcular descuentos antes de agregar al carrito',
          'Validar cupones al momento del checkout',
        ],
      },
      {
        context: 'Kiosk',
        applications: [
          'Mostrar precios con descuentos en tiempo real',
          'Indicar promociones activas en cada producto',
          'Calcular totales con promociones del cliente',
        ],
      },
      {
        context: 'Reportes',
        applications: [
          'Calcular precios históricos',
          'Análisis de efectividad de promociones',
          'Reportes de descuentos aplicados',
        ],
      },
    ],
    integration: {
      title: 'Integración sugerida',
      steps: [
        '1. Importar el hook o componente necesario',
        '2. Llamar el hook con los parámetros del producto',
        '3. Usar los datos devueltos en la UI',
        '4. O usar el componente ProductPriceDisplay directamente para una solución completa',
      ],
      fullExample: `import { ProductPriceDisplay } from '../components/ProductPriceDisplay';

// En el componente:
<ProductPriceDisplay
  productId={selectedProduct.id}
  quantity={1}
  channel="pos"
/>`,
    },
  },
  developmentGuide: [
    {
      topic: 'Principios Fundamentales',
      points: [
        'Seguir la estructura de primitivas de Floot (Pages, Components, Helpers, Endpoints).',
        'Utilizar CSS Modules para estilos para evitar colisiones y mantener el código encapsulado.',
        'El código de producto debe usar camelCase, mientras que los campos de la base de datos son snake_case.',
        'No usar el tipo `any`. Construir tipos adecuados con TypeScript.',
        'Dividir la lógica compleja en helpers y los componentes grandes en subcomponentes.',
      ],
    },
    {
      topic: 'Gestión de Datos',
      points: [
        'Usar TanStack Query (React Query) para todo el fetching y mutación de datos.',
        'Crear hooks personalizados (ej. `useProductsQuery`) para encapsular la lógica de fetching.',
        'Las mutaciones deben invalidar todas las queries relevantes para mantener la UI sincronizada.',
        'Mostrar estados de carga (skeletons) y error en todas las operaciones asíncronas.',
      ],
    },
    {
      topic: 'Formularios',
      points: [
        'Usar React Hook Form para la gestión del estado de los formularios.',
        'Definir esquemas de validación con Zod. Reutilizar los esquemas de los endpoints siempre que sea posible.',
      ],
    },
    {
      topic: 'Seguridad',
      points: [
        'Nunca acceder a `process.env` en el código del frontend.',
        'Los secrets se gestionan a través del panel de Floot, no en archivos `.env`.',
        'La lógica que utiliza secrets debe residir exclusivamente en los endpoints del backend.',
      ],
    },
  ],
  deploymentProcess: {
    title: 'Proceso de Publicación en Floot',
    steps: [
      '1. (Pre-Despliegue) Navegar a la página `/admin/deployment`.',
      '2. Ejecutar los "Pre-Deployment Checks" para validar la integridad de los datos de producción.',
      '3. Si los chequeos son exitosos, ir al panel de control del proyecto en la plataforma de Floot.',
      '4. Hacer clic en el botón "Publish" para desplegar la última versión del código.',
      '5. (Post-Despliegue) Volver a la página `/admin/deployment` y ejecutar la "Post-Deployment Verification" para asegurar que todos los sistemas están operativos.',
      '6. Monitorear los logs en la misma página para cualquier actividad inusual.',
    ],
  },
  troubleshooting: [
    {
      problem: 'Una variable de entorno es `undefined` en el frontend.',
      solution: 'Esto es esperado. Las variables de entorno del servidor no están disponibles en el cliente. Si es una clave pública, configúrala para ser expuesta a través de `_publicConfigs.tsx`. Si es un secreto, crea un endpoint que la utilice y devuelva solo los datos necesarios.',
    },
    {
      problem: 'Los datos en la UI no se actualizan después de una mutación (crear/editar/eliminar).',
      solution: 'Asegúrate de que la función `onSuccess` de tu `useMutation` hook esté invalidando las queries correctas usando `queryClient.invalidateQueries({ queryKey: [...] })`.',
    },
    {
      problem: 'La aplicación muestra una página en blanco o se queda cargando indefinidamente.',
      solution: 'Revisa la consola del navegador en busca de errores. Comúnmente, esto puede ser un error en un hook de `useAuth` o un problema con la configuración de `_globalContextProviders`.',
    },
  ],
  roadmap: [
    {
      feature: 'Políticas de RRHH',
      description: 'Implementar una sección para gestionar documentos y políticas de recursos humanos.',
      priority: 'Medium',
    },
    {
      feature: 'Logs de Auditoría',
      description: 'Crear un sistema de logs para registrar acciones críticas de los usuarios en el panel de administración.',
      priority: 'High',
    },
    {
      feature: 'Integración con Pasarelas de Pago',
      description: 'Integrar con servicios de pago externos para automatizar las transacciones con tarjeta.',
      priority: 'High',
    },
    {
      feature: 'Dashboard de Analytics Avanzado',
      description: 'Expandir el dashboard de reportes con más métricas, gráficos y filtros personalizables.',
      priority: 'Medium',
    },
  ],
};

// --- HELPER FUNCTIONS ---

/**
 * Genera una versión en Markdown de la documentación del proyecto.
 * @returns Una cadena de texto formateada en Markdown.
 */
export function generateMarkdown(): string {
  const doc = projectDocumentation;
  let md = `# Documentación del Proyecto: ${doc.projectInfo.name}\n\n`;
  md += `${doc.projectInfo.description}\n\n`;

  md += `## Módulos Principales\n`;
  for (const key in doc.mainModules) {
    const module = doc.mainModules[key as keyof typeof doc.mainModules];
    md += `### ${module.name}\n`;
    md += `${module.description}\n`;
    md += `**Funcionalidades Clave:**\n`;
    module.keyFunctionalities.forEach(f => (md += `- ${f}\n`));
    md += `\n`;
  }

  md += `## Guía de Desarrollo\n`;
  doc.developmentGuide.forEach(guide => {
    md += `### ${guide.topic}\n`;
    guide.points.forEach(p => (md += `- ${p}\n`));
    md += `\n`;
  });

  md += `## Cálculo de Precios con Promociones\n`;
  md += `${doc.priceCalculationGuide.overview}\n\n`;
  md += `### Endpoint\n`;
  md += `**${doc.priceCalculationGuide.endpoint.title}**\n`;
  md += `**Entrada:**\n`;
  doc.priceCalculationGuide.endpoint.input.forEach(item => (md += `- ${item}\n`));
  md += `**Salida:**\n`;
  doc.priceCalculationGuide.endpoint.output.forEach(item => (md += `- ${item}\n`));
  md += `\n`;

  md += `### Hooks React Query\n`;
  doc.priceCalculationGuide.hooks.forEach(hook => {
    md += `#### ${hook.name}\n`;
    md += `${hook.description}\n`;
    md += `\`\`\`typescript\n${hook.example}\n\`\`\`\n\n`;
  });

  md += `### Componente Visual\n`;
  md += `**${doc.priceCalculationGuide.component.name}**\n`;
  md += `${doc.priceCalculationGuide.component.description}\n`;
  md += `\`\`\`typescript\n${doc.priceCalculationGuide.component.example}\n\`\`\`\n\n`;

  md += `## Proceso de Despliegue\n`;
  doc.deploymentProcess.steps.forEach(step => (md += `${step}\n`));

  return md;
}

/**
 * Obtiene información detallada sobre un módulo específico.
 * @param moduleName - El nombre clave del módulo (ej. 'admin', 'pos').
 * @returns El objeto del módulo o undefined si no se encuentra.
 */
export function getModuleInfo(moduleName: keyof typeof projectDocumentation.mainModules): ProjectModule | undefined {
  return projectDocumentation.mainModules[moduleName];
}

/**
 * Crea un reporte de estado del proyecto.
 * @returns Un objeto con un resumen del estado actual del proyecto.
 */
export function createProjectStatusReport(): {
  projectName: string;
  version: string;
  totalModules: number;
  totalEndpoints: number;
  nextHighPriorityFeature: string;
} {
  const doc = projectDocumentation;
  const nextFeature = doc.roadmap.find(item => item.priority === 'High');

  return {
    projectName: doc.projectInfo.name,
    version: doc.projectInfo.version,
    totalModules: Object.keys(doc.mainModules).length,
    totalEndpoints: doc.apiEndpoints.length,
    nextHighPriorityFeature: nextFeature ? nextFeature.feature : 'No high-priority features defined',
  };
}

/**
 * Exporta la documentación completa en el formato especificado.
 * @param format - El formato de exportación ('json' o 'string').
 * @returns La documentación como un objeto JSON o una cadena de texto.
 */
export function exportDocumentation(format: 'json' | 'string'): string {
  if (format === 'json') {
    return JSON.stringify(projectDocumentation, null, 2);
  }
  return JSON.stringify(projectDocumentation);
}

/**
 * Cuenta el total de features implementadas en todos los módulos.
 * @returns El número total de features implementadas.
 */
export function countImplementedFeatures(): number {
  return projectDocumentation.implementedFunctionalities.reduce(
    (total, module) => total + module.features.length,
    0
  );
}

/**
 * Cuenta el total de endpoints API en el proyecto.
 * @returns El número total de endpoints.
 */
export function countApiEndpoints(): number {
  return projectDocumentation.apiEndpoints.length;
}

/**
 * Obtiene estadísticas generales del proyecto.
 * @returns Un objeto con estadísticas del proyecto.
 */
export function getProjectStats(): {
  totalFeatures: number;
  totalEndpoints: number;
  totalModules: number;
  totalTechnologies: number;
  protectedEndpoints: number;
  highPriorityRoadmapItems: number;
} {
  const doc = projectDocumentation;
  
  return {
    totalFeatures: countImplementedFeatures(),
    totalEndpoints: countApiEndpoints(),
    totalModules: Object.keys(doc.mainModules).length,
    totalTechnologies: doc.technologies.length,
    protectedEndpoints: doc.apiEndpoints.filter(endpoint => endpoint.isProtected).length,
    highPriorityRoadmapItems: doc.roadmap.filter(item => item.priority === 'High').length,
  };
}

/**
 * Obtiene la lista de tecnologías utilizadas en el proyecto.
 * @returns Un array con las tecnologías y sus detalles.
 */
export function getTechnologiesList(): TechStackItem[] {
  return [...projectDocumentation.technologies];
}