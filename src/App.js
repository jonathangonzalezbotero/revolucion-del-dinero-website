import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Evento from './pages/Evento';
import useFacebookPixelPageView from './hooks/useFacebookPixelPageView';

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
