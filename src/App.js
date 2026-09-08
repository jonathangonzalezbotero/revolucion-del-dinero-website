import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Evento from './pages/Evento';
import Bootcamp from './pages/Bootcamp';
import BootcampGracias from './pages/BootcampGracias';
import Circulo from './pages/Circulo';
import CirculoGracias from './pages/CirculoGracias';
import Terminos from './pages/Terminos';
import Checkin from './pages/Checkin';
import useFacebookPixelPageView from './hooks/useFacebookPixelPageView';

// /checkin es solo para la puerta del evento: nada de píxel. La carga inicial ya se
// omite en public/index.html; esto cubre las navegaciones dentro de la SPA.
function PixelTracker() {
  useFacebookPixelPageView();
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <PixelTracker />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/evento" element={<Evento />} />
        <Route path="/bootcamp" element={<Bootcamp />} />
        <Route path="/bootcamp/gracias" element={<BootcampGracias />} />
        <Route path="/circulo" element={<Circulo />} />
        <Route path="/circulo/gracias" element={<CirculoGracias />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/checkin" element={<Checkin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
