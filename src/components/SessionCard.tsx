import React from 'react';
import { ClientType } from '@/types';

interface SessionCardProps {
    sessionId: string;
    clientType: ClientType;
    customerName?: string;
    pinCode?: string;
    customerPhotoUrl?: string;
    tower?: string;
    apartment?: string;
    itemCount: number;
    totalAmount: number;
    onClick: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
    sessionId,
    clientType,
    customerName,
    pinCode,
    customerPhotoUrl,
    tower,
    apartment,
    itemCount,
    totalAmount,
    onClick
}) => {
    const borderClass = {
        [ClientType.FACIAL]: 'border-facial',
        [ClientType.PIN]: 'border-pin',
        [ClientType.NO_ID]: 'border-no-id'
    }[clientType];

    const getDisplayName = () => {
        if (clientType === ClientType.FACIAL && customerName) return customerName;
        if (clientType === ClientType.PIN && pinCode) return `PIN-${pinCode}`;
        return 'No Identificado';
    };

    const getStatusLabel = () => {
        if (clientType === ClientType.FACIAL) return '🟢 FACIAL';
        if (clientType === ClientType.PIN) return '🟡 PIN TEMPORAL';
        return '🔴 SIN IDENTIFICAR';
    };

    const getAvatarContent = () => {
        if (clientType === ClientType.PIN) return '🔑';
        if (clientType === ClientType.NO_ID) return '?';
        if (customerPhotoUrl) {
            return <img src={customerPhotoUrl} alt={customerName} className="w-full h-full object-cover" />;
        }
        return customerName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div
            className={`card ${borderClass} cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1`}
            onClick={onClick}
        >
            <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-2xl font-semibold overflow-hidden">
                    {getAvatarContent()}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{getDisplayName()}</h3>
                    <p className="text-sm text-muted">
                        {getStatusLabel()}
                    </p>
                    {(clientType === ClientType.FACIAL || clientType === ClientType.PIN) && (tower || apartment) && (
                        <p className="text-xs text-muted mt-1">
                            📍 {tower && `Torre ${tower}`}{tower && apartment && ' - '}{apartment && `Apto ${apartment}`}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="text-sm text-muted">🛒 {itemCount ?? 0} items</span>
                <span className="text-3xl font-bold">${(totalAmount ?? 0).toLocaleString('es-CO')}</span>
            </div>
        </div>
    );
};
