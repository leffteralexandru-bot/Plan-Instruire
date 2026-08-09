/** Scroll la modulele Ghid / Repository / Mentenanță, sub meniul sticky. */

export function scrollReferenceModulesIntoView(): void {
  const run = () => {
    const el =
      document.getElementById('employee-reference-modules') ??
      document.querySelector('[data-reference-modules]');
    if (!el) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const sticky = document.querySelector('header.sticky');
    const chrome = sticky ? Math.ceil(sticky.getBoundingClientRect().height) : 160;
    const y = el.getBoundingClientRect().top + window.scrollY - chrome - 8;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  };
  window.setTimeout(run, 0);
  window.setTimeout(run, 120);
  window.setTimeout(run, 400);
}
