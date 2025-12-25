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
    // Neumorphism Design - Soft UI with embossed effect
    const colorSchemes = {
        [ClientType.FACIAL]: {
            borderColor: '#22c55e', // Green accent
            badge: 'FACIAL'
        },
        [ClientType.PIN]: {
            borderColor: '#eab308', // Yellow accent
            badge: 'PIN'
        },
        [ClientType.NO_ID]: {
            borderColor: '#ef4444', // Red accent
            badge: 'NO ID'
        }
    };

    const scheme = colorSchemes[clientType];

    const getDisplayName = () => {
        if (clientType === ClientType.FACIAL && customerName) return customerName;
        if (clientType === ClientType.PIN && customerName) return customerName;
        if (clientType === ClientType.PIN && pinCode) return `PIN-${pinCode}`;
        return 'No Identificado';
    };

    const shouldShowPhoto = () => {
        if (clientType === ClientType.PIN) return false;
        return (clientType === ClientType.FACIAL || clientType === ClientType.NO_ID) && customerPhotoUrl;
    };

    return (
        <div
            className="rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden"
            style={{
                background: '#ffffff',
                // Neumorphism dual shadows: light (top-left) + dark (bottom-right)
                boxShadow: '8px 8px 15px rgba(163, 177, 198, 0.6), -8px -8px 15px rgba(255, 255, 255, 0.5)',
                minHeight: '200px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px',
                padding: '24px',
                position: 'relative',
                borderLeft: `4px solid ${scheme.borderColor}`
            }}
            onClick={onClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '12px 12px 20px rgba(163, 177, 198, 0.6), -12px -12px 20px rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '8px 8px 15px rgba(163, 177, 198, 0.6), -8px -8px 15px rgba(255, 255, 255, 0.5)';
            }}
        >
            {/* Left: Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{
                    color: '#2d3436',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    marginBottom: '12px',
                    lineHeight: 1.2
                }}>
                    {getDisplayName()}
                </h3>

                {(tower || apartment) && (
                    <div style={{
                        color: '#636e72',
                        fontSize: '1.05rem',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        📍 {tower}{tower && apartment && '-'}{apartment}
                    </div>
                )}

                <div style={{
                    color: '#636e72',
                    fontSize: '1.05rem',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    🛒 {itemCount ?? 0} productos
                </div>

                <div style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginTop: '12px',
                    background: '#dfe6e9',
                    color: '#2d3436',
                    width: 'fit-content'
                }}>
                    {scheme.badge}
                </div>

                <div style={{
                    color: '#2d3436',
                    fontSize: '2.2rem',
                    fontWeight: 700,
                    marginTop: '16px'
                }}>
                    ${(totalAmount ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                </div>
            </div>

            {/* Right: Photo (Circular) */}
            <div style={{
                width: '150px',
                height: '150px',
                flexShrink: 0,
                borderRadius: '50%',
                border: '4px solid rgba(255, 255, 255, 0.5)',
                overflow: 'hidden',
                position: 'relative',
                // Subtle shadow on photo
                boxShadow: '4px 4px 8px rgba(163, 177, 198, 0.4), -4px -4px 8px rgba(255, 255, 255, 0.3)'
            }}>
                {shouldShowPhoto() ? (
                    <img
                        src={customerPhotoUrl}
                        alt={getDisplayName()}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                ) : (
                    // Generic silhouette for PIN users - White SVG with gray 3D effect
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #00bfff 0%, #0099cc 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg
                            width="100"
                            height="100"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{
                                filter: 'drop-shadow(2px 2px 3px rgba(80, 80, 80, 0.4)) drop-shadow(-1px -1px 1px rgba(200, 200, 200, 0.2))'
                            }}
                        >
                            <circle cx="12" cy="8" r="4" fill="white" />
                            <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" fill="white" strokeLinecap="round" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};
