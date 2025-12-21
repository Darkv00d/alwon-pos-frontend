import React from "react";
import {
  ShieldCheck,
  Users,
  UserPlus,
  KeyRound,
  HelpCircle,
  Lock,
} from "lucide-react";
import styles from "./customerPinSetupGuide.module.css";

/**
 * A documentation component explaining the mandatory customer PIN system.
 * This component is for informational purposes only and does not export any functions.
 */
export const CustomerPinSetupGuide = () => {
  const existingCustomers = [
    { name: "John Smith", code: "CUST000001" },
    { name: "Maria Garcia", code: "CUST000002" },
    { name: "David Chen", code: "CUST000003" },
    { name: "Sarah Johnson", code: "CUST000004" },
    { name: "Ahmed Al-Rashid", code: "CUST000005" },
  ];

  return (
    <div className={styles.guideContainer}>
      <h1 className={styles.title}>Guía de Implementación: PIN de Cliente</h1>
      <p className={styles.intro}>
        Este documento detalla el funcionamiento y las reglas del nuevo sistema
        de PIN de seguridad para clientes del programa de lealtad.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionHeader}>
          <ShieldCheck size={20} />
          <span>1. Sistema de PIN Obligatorio</span>
        </h2>
        <p>
          Para mejorar la seguridad y la experiencia del cliente, todos los
          clientes <strong>DEBEN</strong> tener un PIN de 4 a 6 dígitos para
          acceder y utilizar sus puntos de lealtad en el POS.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionHeader}>
          <Users size={20} />
          <span>2. Clientes Existentes</span>
        </h2>
        <p>
          Para facilitar la transición, se ha establecido un PIN por defecto
          para todos los clientes existentes que no tenían uno.
        </p>
        <ul className={styles.list}>
          <li>
            PIN por defecto: <code className={styles.code}>1234</code>
          </li>
          <li>
            Se recomienda a los clientes cambiar este PIN en su próxima visita.
          </li>
          <li>
            <strong>Clientes Afectados:</strong>
            <ul className={`${styles.list} ${styles.subList}`}>
              {existingCustomers.map((customer) => (
                <li key={customer.code}>
                  {customer.name} (
                  <code className={styles.code}>{customer.code}</code>)
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionHeader}>
          <UserPlus size={20} />
          <span>3. Nuevos Clientes</span>
        </h2>
        <p>
          El campo de PIN es <strong>OBLIGATORIO</strong> al registrar un nuevo
          cliente.
        </p>
        <ul className={styles.list}>
          <li>
            El formulario de registro de clientes ahora incluye un campo para un
            PIN de 4 a 6 dígitos.
          </li>
          <li>No es posible crear un nuevo perfil de cliente sin un PIN.</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionHeader}>
          <KeyRound size={20} />
          <span>4. Cambio de PIN</span>
        </h2>
        <p>
          Los clientes pueden actualizar su PIN en cualquier momento a través
          del formulario de edición de cliente.
        </p>
        <ul className={styles.list}>
          <li>
            En el formulario, el administrador debe ingresar el nuevo PIN en el
            campo correspondiente.
          </li>
          <li>
            Si el campo de PIN se deja <strong>vacío</strong> durante la
            edición, el PIN actual se mantendrá sin cambios.
          </li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionHeader}>
          <HelpCircle size={20} />
          <span>5. Recuperación de PIN</span>
        </h2>
        <p>
          Si un cliente olvida su PIN, el personal puede ayudarlo a
          restablecerlo directamente desde la interfaz del POS.
        </p>
        <ul className={styles.list}>
          <li>
            Utilizar la función <strong>"¿Olvidó su PIN?"</strong> en la
            pantalla de identificación del cliente en el POS.
          </li>
          <li>
            El sistema solicitará una verificación de identidad (ej. email o
            número de teléfono registrado).
          </li>
          <li>
            Una vez verificado, el sistema permitirá establecer un nuevo PIN.
          </li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionHeader}>
          <Lock size={20} />
          <span>6. Seguridad</span>
        </h2>
        <p>
          La seguridad del PIN es una prioridad para proteger las cuentas de
          los clientes.
        </p>
        <ul className={styles.list}>
          <li>
            Los PINs se almacenan de forma segura utilizando un hash{" "}
            <strong>bcrypt</strong>. Nunca se guardan en texto plano.
          </li>
          <li>
            Cualquier transacción que involucre el uso de puntos de lealtad
            (canje) requerirá la verificación del PIN.
          </li>
          <li>
            Una vez que un PIN está configurado,{" "}
            <strong>no es posible deshabilitarlo</strong> o eliminarlo. Solo se
            puede cambiar.
          </li>
        </ul>
      </div>
    </div>
  );
};