import { useState } from 'react'
import './App.css'
import KioskPOS from './components/KioskPOS'
import ModeSelector, { type IdentificationMode } from './components/ModeSelector'

function App() {
  const [selectedMode, setSelectedMode] = useState<IdentificationMode | null>(null);

  if (!selectedMode) {
    return <ModeSelector onModeSelected={setSelectedMode} />;
  }

  return (
    <div className="app">
      <KioskPOS identificationMode={selectedMode} />
    </div>
  )
}

export default App
