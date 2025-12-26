import React from 'react';
import { ClientType } from '@/types';
import './CustomerInfo.css';

interface CustomerInfoProps {
    clientType: ClientType;
    customerName?: string;
    customerPhotoUrl?: string;
    tower?: string;
    apartment?: string;
    sessionId: string;
}

export const CustomerInfo: React.FC<CustomerInfoProps> = ({
    clientType,
    customerName,
    customerPhotoUrl,
    tower,
    apartment,
    sessionId
}) => {
    const getClientTypeLabel = (): string => {
        switch (clientType) {
            case ClientType.FACIAL:
                return '🟢 CLIENTE FACIAL';
            case ClientType.PIN:
                return '🟡 CLIENTE PIN';
            case ClientType.NO_ID:
                return '🔴 NO IDENTIFICADO';
            default:
                return '❓ DESCONOCIDO';
        }
    };

    const getBorderClass = (): string => {
        switch (clientType) {
            case ClientType.FACIAL:
                return 'customer-info-facial';
            case ClientType.PIN:
                return 'customer-info-pin';
            case ClientType.NO_ID:
                return 'customer-info-no-id';
            default:
                return '';
        }
    };

    const displayName = customerName || 'Cliente No Identificado';
    const showLocation = clientType !== ClientType.NO_ID && tower && apartment;

    return (
        <div className={`customer-info ${getBorderClass()}`}>
            <div className="customer-avatar">
                {/* PIN clients never show photo (privacy) */}
                {clientType === ClientType.PIN ? (
                    <span>🔑</span>
                ) : customerPhotoUrl ? (
                    <img src={customerPhotoUrl} alt="Cliente" />
                ) : (
                    <span>👤</span>
                )}
            </div>

            <div className="customer-details">
                <div className="customer-name">{displayName}</div>

                {showLocation && (
                    <div className="customer-location">
                        📍 Torre {tower} - Apto {apartment}
                    </div>
                )}

                <span className="customer-type">{getClientTypeLabel()}</span>
                <div className="customer-session">Sesión: {sessionId}</div>
            </div>
        </div>
    );
};
