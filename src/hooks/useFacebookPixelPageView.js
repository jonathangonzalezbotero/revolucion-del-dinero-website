import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// The Meta Pixel base snippet (public/index.html) fires one 'PageView' on the
// initial full page load. React Router navigations never reload the page, so
// without this, every route after the first is invisible to the pixel.
function useFacebookPixelPageView() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [location.pathname, location.search]);
}

export default useFacebookPixelPageView;
