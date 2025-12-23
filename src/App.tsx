import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { CartView } from '@/pages/CartView';
import { PaymentView } from '@/pages/PaymentView';
import { useWebSocket } from '@/hooks/useWebSocket';
import '@/styles/base.css';

function App() {
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cart/:sessionId" element={<CartView />} />
        <Route path="/payment/:sessionId" element={<PaymentView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
