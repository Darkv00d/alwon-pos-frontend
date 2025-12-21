import './ModeSelector.css';

export type IdentificationMode = 'facial' | 'pin' | 'unidentified';

interface ModeSelectorProps {
    onModeSelected: (mode: IdentificationMode) => void;
}

function ModeSelector({ onModeSelected }: ModeSelectorProps) {
    return (
        <div className="mode-selector-container">
            <div className="mode-selector-content">
                <div className="mode-header">
                    <div className="logo">
                        <div className="logo-icon">A</div>
                        <span className="logo-text">Alwon</span>
                    </div>
                    <h1 className="mode-title">Modo de Identificación</h1>
                    <p className="mode-subtitle">Seleccione el tipo de acceso para pruebas</p>
                </div>

                <div className="mode-options">
                    <button
                        className="mode-card facial-mode"
                        onClick={() => onModeSelected('facial')}
                    >
                        <div className="mode-icon">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="10" r="3" />
                                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                            </svg>
                        </div>
                        <h3>Reconocimiento Facial</h3>
                        <p>Cliente identificado con foto</p>
                        <div className="mode-badge">Predeterminado</div>
                    </button>

                    <button
                        className="mode-card pin-mode"
                        onClick={() => onModeSelected('pin')}
                    >
                        <div className="mode-icon">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <h3>Acceso con PIN</h3>
                        <p>Cliente sin reconocimiento facial</p>
                        <div className="mode-badge">Privacidad</div>
                    </button>

                    <button
                        className="mode-card unidentified-mode"
                        onClick={() => onModeSelected('unidentified')}
                    >
                        <div className="mode-icon">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M12 8v4" />
                                <path d="M12 16h.01" />
                            </svg>
                        </div>
                        <h3>No Identificado</h3>
                        <p>Persona sin registro previo</p>
                        <div className="mode-badge warning">Advertencia</div>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModeSelector;
