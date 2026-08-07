import { useEffect } from 'react';

function useRevealOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 3) * 70}ms`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
}

export default useRevealOnScroll;
