import React from 'react';
import styles from './environmentDocumentation.module.css';
import { Code, AlertTriangle, CheckCircle, HelpCircle, BookOpen, KeyRound, Shield } from 'lucide-react';

/**
 * A comprehensive documentation component explaining environment variable and secrets management
 * within the Floot framework for the Alwon POS project.
 */
export const EnvironmentDocumentation: React.FC = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <BookOpen size={48} className={styles.headerIcon} />
        <div>
          <h1>Gestión de Entorno y Secrets en Floot</h1>
          <p className={styles.subtitle}>Guía completa para desarrolladores de Alwon POS</p>
        </div>
      </header>

      <section className={styles.section}>
        <h2 id="intro"><Code className={styles.icon} /> Introducción: El Enfoque de Floot</h2>
        <p>
          A diferencia de los sistemas tradicionales que usan archivos <code>.env</code>, Floot maneja las variables de entorno y los "secrets" de una manera más segura y estructurada. Las variables no se almacenan en archivos dentro del repositorio, sino que se inyectan de forma segura en los entornos de ejecución (desarrollo, staging, producción) a través de la plataforma de Floot.
        </p>
        <p>
          Esto mejora la seguridad al evitar que las credenciales se filtren en el control de versiones y simplifica la configuración para diferentes entornos.
        </p>
      </section>

      <section className={styles.section}>
        <h2 id="existing-resources"><KeyRound className={styles.icon} /> Recursos y Variables de Entorno Disponibles</h2>
        <p>A continuación se detallan las variables de entorno configuradas para el proyecto Alwon POS. Estas variables solo están disponibles en el <strong>backend (endpoints)</strong>.</p>
        
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Variable de Entorno</th>
                <th>Descripción</th>
                <th>Ejemplo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>DATABASE_URL</code></td>
                <td>URL de conexión a la base de datos PostgreSQL. Incluye usuario, contraseña, host y nombre de la base de datos.</td>
                <td><code>postgres://user:pass@host:port/db</code></td>
              </tr>
              <tr>
                <td><code>JWT_SECRET</code></td>
                <td>Clave secreta para firmar y verificar los JSON Web Tokens (JWT) de sesión de usuario. Debe ser una cadena larga y aleatoria.</td>
                <td><code>una-clave-muy-larga-y-secreta</code></td>
              </tr>
              <tr>
                <td><code>CLOUDINARY_URL</code></td>
                <td>URL de configuración para el servicio de Cloudinary, usado para el almacenamiento y gestión de imágenes (ej. avatares, fotos de productos).</td>
                <td><code>cloudinary://api_key:api_secret@cloud_name</code></td>
              </tr>
              <tr>
                <td><code>COMPANY_NAME</code></td>
                <td>(Opcional) Sobrescribe el nombre de la compañía. Usado por <code>helpers/config.tsx</code>.</td>
                <td><code>"Mi Minimarket"</code></td>
              </tr>
              <tr>
                <td><code>CURRENCY</code></td>
                <td>(Opcional) Sobrescribe el código de la moneda. Usado por <code>helpers/config.tsx</code>.</td>
                <td><code>"USD"</code></td>
              </tr>
              <tr>
                <td><code>LOCALE</code></td>
                <td>(Opcional) Sobrescribe la configuración regional. Usado por <code>helpers/config.tsx</code>.</td>
                <td><code>"en-US"</code></td>
              </tr>
              <tr>
                <td><code>TIMEZONE</code></td>
                <td>(Opcional) Sobrescribe la zona horaria. Usado por <code>helpers/config.tsx</code>.</td>
                <td><code>"America/New_York"</code></td>
              </tr>
              <tr>
                <td><code>TAX_RATE</code></td>
                <td>(Opcional) Sobrescribe la tasa de impuestos como decimal. Usado por <code>helpers/config.tsx</code>.</td>
                <td><code>"0.08"</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 id="public-config"><CheckCircle className={styles.icon} /> Configuración Pública (Frontend)</h2>
        <p>
          Las variables de entorno del servidor <strong>nunca</strong> están disponibles directamente en el código del frontend (componentes, páginas) por razones de seguridad. Floot proporciona un mecanismo para exponer de forma segura configuraciones específicas al cliente.
        </p>
        <div className={styles.infoBox}>
          <p><strong><code>helpers/config.tsx</code></strong>: Este helper es la fuente de verdad para la configuración de la aplicación. En el backend, lee las variables de entorno. En el frontend, utiliza valores predeterminados seguros y codificados. Esto permite que el mismo código (<code>appConfig.currency</code>) funcione en ambos entornos sin exponer secrets.</p>
          <p><strong><code>helpers/_publicConfigs.tsx</code></strong>: Este archivo es generado automáticamente por Floot durante el proceso de compilación. Si necesitas exponer una variable de entorno del servidor al cliente (por ejemplo, una clave de API pública de Google Maps), debes configurarla en el panel de Floot para que se incluya aquí. <strong>Nunca expongas secrets en este archivo.</strong></p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 id="new-resources"><Shield className={styles.icon} /> Cómo Agregar Nuevos Secrets o Variables</h2>
        <p>
          Para agregar una nueva variable de entorno (ej. la API key para un nuevo servicio), no debes modificar ningún archivo local. El proceso se gestiona a través del panel de control o la CLI de Floot:
        </p>
        <ol className={styles.orderedList}>
          <li>Accede al panel de control de tu proyecto en Floot.</li>
          <li>Navega a la sección de "Environment Variables" o "Secrets".</li>
          <li>Agrega la nueva variable, especificando su nombre (ej. <code>STRIPE_API_KEY</code>) y su valor.</li>
          <li>Asigna la variable a los entornos necesarios (desarrollo, staging, producción). Puedes tener valores diferentes para cada entorno.</li>
          <li>Guarda los cambios. Es posible que necesites reiniciar el servidor de desarrollo o redesplegar la aplicación para que los cambios surtan efecto.</li>
        </ol>
        <p>Este proceso centralizado asegura que los secrets nunca se almacenen en el código fuente.</p>
      </section>

      <section className={styles.section}>
        <h2 id="best-practices"><Shield className={styles.icon} /> Mejores Prácticas de Seguridad</h2>
        <ul className={styles.bestPracticesList}>
          <li><span className={styles.emoji}>🚫</span> <strong>Nunca</strong> cometas secrets, API keys, o contraseñas en Git.</li>
          <li><span className={styles.emoji}>🔒</span> Utiliza el principio de mínimo privilegio: solo expón al frontend las configuraciones estrictamente necesarias y que sean seguras para ser públicas.</li>
          <li><span className={styles.emoji}>🔑</span> Rota las claves y credenciales periódicamente, especialmente si sospechas que han sido expuestas.</li>
          <li><span className={styles.emoji}>🏢</span> Utiliza variables de entorno diferentes para cada entorno (desarrollo, staging, producción) para aislar los sistemas.</li>
          <li><span className={styles.emoji}>🖥️</span> Todo el código que accede a secrets debe ejecutarse en el backend (endpoints). El frontend solo debe recibir los datos ya procesados.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 id="differences"><AlertTriangle className={styles.icon} /> Diferencias con <code>.env</code> Tradicional</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Característica</th>
                <th>Enfoque Floot</th>
                <th>Enfoque <code>.env</code> Tradicional</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Almacenamiento</strong></td>
                <td>Centralizado y seguro en la plataforma Floot. Fuera del repositorio.</td>
                <td>Archivos locales (<code>.env</code>) en la raíz del proyecto. Riesgo de commit accidental.</td>
              </tr>
              <tr>
                <td><strong>Gestión de Entornos</strong></td>
                <td>Gestionado por entorno (dev, staging, prod) en el panel de Floot.</td>
                <td>Requiere múltiples archivos (<code>.env.production</code>, <code>.env.development</code>) y lógica de carga.</td>
              </tr>
              <tr>
                <td><strong>Seguridad</strong></td>
                <td>Alta. Los secrets nunca están en el código fuente.</td>
                <td>Menor. Depende de la disciplina del desarrollador y de un <code>.gitignore</code> correcto.</td>
              </tr>
              <tr>
                <td><strong>Acceso en Frontend</strong></td>
                <td>No es posible acceder a <code>process.env</code>. Requiere un mecanismo de exposición explícito (<code>_publicConfigs.tsx</code>).</td>
                <td>Variables con prefijo (ej. <code>REACT_APP_</code>) se empaquetan en el build, lo que puede exponer información sensible si no se tiene cuidado.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 id="troubleshooting"><HelpCircle className={styles.icon} /> Troubleshooting: Problemas Comunes</h2>
        <div className={styles.troubleshootingItem}>
          <h4>Problema: Mi variable es <code>undefined</code> en el frontend.</h4>
          <p><strong>Causa:</strong> Estás intentando acceder a <code>process.env.MI_VARIABLE</code> en un componente o página. Esto no funciona en Floot.</p>
          <p><strong>Solución:</strong>
            <ol className={styles.orderedList}>
              <li>Si la variable <strong>no es un secret</strong> y debe ser pública, configúrala en el panel de Floot para que se incluya en <code>_publicConfigs.tsx</code> y luego impórtala desde allí.</li>
              <li>Si la variable <strong>es un secret</strong>, crea un endpoint en el backend que la utilice y devuelva al frontend solo los datos necesarios y no sensibles.</li>
            </ol>
          </p>
        </div>
        <div className={styles.troubleshootingItem}>
          <h4>Problema: Mi variable es <code>undefined</code> en un endpoint del backend.</h4>
          <p><strong>Causa:</strong> La variable no ha sido configurada para el entorno en el que estás trabajando (ej. desarrollo local).</p>
          <p><strong>Solución:</strong> Ve al panel de Floot y asegúrate de que la variable de entorno esté definida y asignada correctamente al entorno correspondiente. Después, reinicia tu servidor de desarrollo local.</p>
        </div>
        <div className={styles.troubleshootingItem}>
          <h4>Problema: Agregué una variable nueva pero la aplicación no la reconoce.</h4>
          <p><strong>Causa:</strong> El proceso del servidor necesita ser reiniciado para cargar las nuevas variables de entorno.</p>
          <p><strong>Solución:</strong> Si estás en desarrollo local, detén y reinicia el servidor (<code>npm run dev</code>). Si estás en un entorno desplegado (staging/producción), realiza un nuevo despliegue para que los cambios surtan efecto.</p>
        </div>
      </section>
    </div>
  );
};