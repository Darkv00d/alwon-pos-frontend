import React from 'react';
import {
  Rocket,
  ClipboardCheck,
  Activity,
  Undo2,
  Database,
  Archive,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import styles from './deploymentGuide.module.css';

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <section className={styles.section}>
    <h2 className={styles.sectionTitle}>
      <Icon className={styles.icon} size={24} />
      {title}
    </h2>
    <div className={styles.sectionContent}>{children}</div>
  </section>
);

export const DeploymentGuide = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Guía de Deployment y Mantenimiento en Floot</h1>
        <p>
          Mejores prácticas para asegurar un ciclo de vida de desarrollo robusto,
          seguro y eficiente para la aplicación Alwon POS.
        </p>
      </header>

      <Section icon={Rocket} title="1. Guía de Deployment en Floot">
        <p>
          El framework Floot simplifica el proceso de deployment a un solo clic.
          Desde el dashboard de tu proyecto en Floot, encontrarás un botón de{' '}
          <strong>"Publish"</strong>.
        </p>
        <ul>
          <li>
            <strong>Proceso Automatizado:</strong> Al hacer clic, Floot
            automáticamente construye el proyecto, crea una imagen de contenedor
            optimizada, y la despliega en el entorno de producción.
          </li>
          <li>
            <strong>Cero Downtime:</strong> Los deployments se realizan sin
            tiempo de inactividad, asegurando una transición fluida para los

            usuarios.
          </li>
          <li>
            <strong>Simplicidad:</strong> Esta facilidad de uso requiere una
            gran disciplina en las fases previas al deployment para evitar
            introducir errores en producción.
          </li>
        </ul>
      </Section>

      <Section icon={ClipboardCheck} title="2. Checklist Pre-Deployment">
        <p>
          Antes de presionar "Publish", asegúrate de completar los siguientes
          pasos para minimizar riesgos:
        </p>
        <ul className={styles.checklist}>
          <li>
            <ClipboardCheck size={16} />
            <span>
              <strong>Revisión de Código (Code Review):</strong> Todo el código
              nuevo ha sido revisado y aprobado por al menos otro desarrollador.
            </span>
          </li>
          <li>
            <ClipboardCheck size={16} />
            <span>
              <strong>Pruebas (Testing):</strong> Las nuevas funcionalidades y
              correcciones están cubiertas por pruebas unitarias y de
              integración. Se han realizado pruebas manuales de los flujos
              críticos.
            </span>
          </li>
          <li>
            <ClipboardCheck size={16} />
            <span>
              <strong>Variables de Entorno:</strong> Verifica que todas las
              variables de entorno necesarias para producción (
              <code>FLOOT_DATABASE_URL</code>, claves de API, etc.) están
              configuradas correctamente en el dashboard de Floot.
            </span>
          </li>
          <li>
            <ClipboardCheck size={16} />
            <span>
              <strong>Migraciones de Base de Datos:</strong> Si hay cambios en
              el esquema, las migraciones han sido probadas en un entorno de
              staging idéntico a producción.
            </span>
          </li>
          <li>
            <ClipboardCheck size={16} />
            <span>
              <strong>Validación de Datos:</strong> Ejecuta las validaciones de
              integridad desde la página <code>/admin/utilidades</code> para
              detectar inconsistencias antes del deployment.
            </span>
          </li>
          <li>
            <ClipboardCheck size={16} />
            <span>
              <strong>Análisis de Rendimiento:</strong> Revisa el plan de
              ejecución de queries complejas o nuevas usando la utilidad{' '}
              <code>getQueryPlan</code> de <code>helpers/performanceUtils.tsx</code>.
            </span>
          </li>
          <li>
            <ClipboardCheck size={16} />
            <span>
              <strong>Changelog:</strong> Prepara un resumen de los cambios para
              el equipo y los stakeholders.
            </span>
          </li>
        </ul>
      </Section>

      <Section icon={Activity} title="3. Monitoreo Post-Deployment">
        <p>
          Una vez que el deployment esté activo, es crucial monitorear la salud
          de la aplicación:
        </p>
        <ul>
          <li>
            <strong>Logs del Servidor:</strong> Revisa los logs en tiempo real
            desde el dashboard de Floot en busca de errores inesperados.
          </li>
          <li>
            <strong>Métricas de Rendimiento:</strong> Observa las métricas de
            CPU, memoria y tiempos de respuesta que provee Floot.
          </li>
          <li>
            <strong>Smoke Testing:</strong> Realiza una prueba rápida de los
            flujos de usuario más importantes (login, realizar una venta en el
            POS, consultar inventario).
          </li>
          <li>
            <strong>Feedback de Usuarios:</strong> Mantente atento a los canales
            de comunicación por si los usuarios reportan algún comportamiento
            anómalo.
          </li>
        </ul>
      </Section>

      <Section icon={Undo2} title="4. Procedimientos de Rollback">
        <p>
          Si un deployment introduce un error crítico, Floot permite revertir a
          una versión anterior de forma rápida:
        </p>
        <ol>
          <li>
            Navega a la sección de "Deployments" en tu dashboard de Floot.
          </li>
          <li>
            Verás un historial de todos los deployments realizados.
          </li>
          <li>
            Selecciona la versión estable anterior y haz clic en el botón{' '}
            <strong>"Rollback to this version"</strong>.
          </li>
          <li>
            Floot automáticamente redesplegará la versión seleccionada,
            minimizando el impacto del error.
          </li>
        </ol>
      </Section>

      <Section icon={Database} title="5. Mejores Prácticas de Base de Datos">
        <p>
          La base de datos es el corazón de Alwon. Sigue estas prácticas para
          mantenerla saludable:
        </p>
        <ul>
          <li>
            <strong>Índices:</strong> Asegúrate de que todas las columnas
            utilizadas en cláusulas <code>WHERE</code>, <code>JOIN</code> y{' '}
            <code>ORDER BY</code> frecuentes estén indexadas. Usa{' '}
            <code>getQueryPlan</code> para identificar scans de tabla completos.
          </li>
          <li>
            <strong>Conexiones:</strong> Utiliza el pool de conexiones
            configurado en <code>helpers/db.tsx</code>. No crees conexiones
            nuevas manualmente.
          </li>
          <li>
            <strong>Migraciones:</strong> Realiza cambios de esquema a través de
            scripts de migración versionados. Nunca modifiques el esquema de
            producción manualmente.
          </li>
          <li>
            <strong>Consistencia de Datos:</strong> Utiliza las funciones en{' '}
            <code>helpers/dataValidation.tsx</code> periódicamente para
            asegurar la integridad referencial y la consistencia de los datos.
          </li>
        </ul>
      </Section>

      <Section icon={Archive} title="6. Estrategias de Backup">
        <p>
          Floot gestiona backups automáticos de la base de datos, pero es
          importante conocer el proceso:
        </p>
        <ul>
          <li>
            <strong>Backups Automáticos:</strong> Floot realiza backups diarios
            de la base de datos PostgreSQL y los retiene por un período
            definido (consulta la documentación de Floot para detalles
            específicos).
          </li>
          <li>
            <strong>Point-in-Time Recovery (PITR):</strong> Investiga si tu plan
            de Floot soporta PITR, lo que permite restaurar la base de datos a
            cualquier segundo en los últimos días.
          </li>
          <li>
            <strong>Backups Manuales:</strong> Antes de operaciones críticas
            (ej. una migración de datos masiva), considera realizar un backup
            manual a través de las herramientas que provea Floot o usando{' '}
            <code>pg_dump</code>.
          </li>
        </ul>
      </Section>

      <Section icon={Zap} title="7. Optimización de Rendimiento">
        <p>
          Mantén la aplicación rápida y responsiva con estas técnicas:
        </p>
        <ul>
          <li>
            <strong>React Query:</strong> Usa <code>@tanstack/react-query</code>{' '}
            para cachear datos en el frontend, evitar peticiones redundantes y
            gestionar estados de carga/error de forma eficiente.
          </li>
          <li>
            <strong>Memoización:</strong> Utiliza <code>React.memo</code>,{' '}
            <code>useMemo</code>, y <code>useCallback</code> para evitar
            re-renders innecesarios en componentes complejos.
          </li>
          <li>
            <strong>Carga Diferida (Lazy Loading):</strong> Considera la carga
            diferida para componentes pesados o rutas que no son de acceso
            inmediato.
          </li>
          <li>
            <strong>Optimización de Queries:</strong> Usa{' '}
            <code>measureExecutionTime</code> para identificar endpoints lentos
            y <code>getQueryPlan</code> para optimizar las queries de base de
            datos subyacentes.
          </li>
        </ul>
      </Section>

      <Section icon={ShieldCheck} title="8. Checklist de Seguridad">
        <p>
          La seguridad es una responsabilidad compartida. Asegura que la
          aplicación cumpla con estos puntos:
        </p>
        <ul className={styles.checklist}>
          <li>
            <ShieldCheck size={16} />
            <span>
              <strong>Control de Acceso:</strong> Verifica que todos los
              endpoints sensibles estén protegidos y validen los roles de
              usuario adecuadamente (ej. <code>verifyAdminToken</code>).
            </span>
          </li>
          <li>
            <ShieldCheck size={16} />
            <span>
              <strong>Validación de Entradas:</strong> Utiliza Zod en todos los
              endpoints para validar y sanear cualquier dato proveniente del
              cliente.
            </span>
          </li>
          <li>
            <ShieldCheck size={16} />
            <span>
              <strong>Variables de Entorno Seguras:</strong> Nunca incluyas
              secretos (claves de API, contraseñas) en el código fuente.
              Utiliza siempre variables de entorno gestionadas por Floot.
            </span>
          </li>
          <li>
            <ShieldCheck size={16} />
            <span>
              <strong>Dependencias:</strong> Mantén las dependencias del
              proyecto actualizadas para mitigar vulnerabilidades conocidas.
            </span>
          </li>
          <li>
            <ShieldCheck size={16} />
            <span>
              <strong>Políticas de Contenido (CSP):</strong> Configura una
              Content Security Policy robusta para prevenir ataques XSS.
            </span>
          </li>
        </ul>
      </Section>
    </div>
  );
};