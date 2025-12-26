import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import './AdminMenuModal.css';

export const AdminMenuModal: React.FC = () => {
    const {
        showAdminMenuModal,
        setShowAdminMenuModal,
        operator
    } = useAuthStore();

    const handleClose = () => {
        setShowAdminMenuModal(false);
    };

    const handleCloseDayClick = () => {
        // TODO: Implement close day functionality
        alert('Cierre del Día - En desarrollo');
    };

    const handleSalesClick = () => {
        // TODO: Implement sales report functionality
        alert('Ventas del Día - En desarrollo');
    };

    const handleLossesClick = () => {
        // TODO: Implement losses report functionality
        alert('Pérdidas del Día - En desarrollo');
    };

    if (!showAdminMenuModal) return null;

    const currentTime = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content admin-menu-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-icon">⚙️</div>
                    <h2>Opciones Administrativas</h2>
                    <p className="operator-info">
                        Operador: <strong>{operator?.fullName || 'Desconocido'}</strong> •
                        Hora: {currentTime}
                    </p>
                </div>

                <div className="admin-menu">
                    <button className="menu-option" onClick={handleCloseDayClick}>
                        <div className="option-icon">💰</div>
                        <div className="option-content">
                            <h3>Cierre del Día</h3>
                            <p>Finalizar turno y generar reporte de ventas</p>
                        </div>
                    </button>

                    <button className="menu-option" onClick={handleSalesClick}>
                        <div className="option-icon">📊</div>
                        <div className="option-content">
                            <h3>Ventas del Día</h3>
                            <p>Ver reporte de ventas acumuladas hasta ahora</p>
                        </div>
                    </button>

                    <button className="menu-option" onClick={handleLossesClick}>
                        <div className="option-icon">📉</div>
                        <div className="option-content">
                            <h3>Pérdidas del Día</h3>
                            <p>Ver productos descartados, mermas y cancelaciones</p>
                        </div>
                    </button>
                </div>

                <div className="button-group">
                    <button className="btn btn-secondary" onClick={handleClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminMenuModal;
