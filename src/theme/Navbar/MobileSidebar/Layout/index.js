import {useEffect, useRef} from 'react';
import {
  useNavbarMobileSidebar,
  useNavbarSecondaryMenu,
} from '@docusaurus/theme-common/internal';

export default function NavbarMobileSidebarLayout({header, primaryMenu, secondaryMenu}) {
  const dialogRef = useRef(null);
  const mobileSidebar = useNavbarMobileSidebar();
  const secondary = useNavbarSecondaryMenu();

  useEffect(() => {
    if (!mobileSidebar.shown) return;
    const dialog = dialogRef.current;
    dialog.showModal();
    dialog.querySelector('.navbar-sidebar__item:not([hidden]) .menu__link')?.focus();
    return () => dialog.close();
  }, [mobileSidebar.shown]);

  const closeOnBackdrop = (event) => {
    if (event.target !== dialogRef.current) return;
    const rect = dialogRef.current.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) {
      mobileSidebar.toggle();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="navbar-sidebar gyMobileMenu"
      aria-label="Меню GrabYou"
      onCancel={(event) => {
        event.preventDefault();
        mobileSidebar.toggle();
      }}
      onClick={closeOnBackdrop}>
      {header}
      <div className="navbar-sidebar__items">
        <div className="navbar-sidebar__item menu" hidden={secondary.shown}>
          {primaryMenu}
        </div>
        <div className="navbar-sidebar__item menu" hidden={!secondary.shown}>
          {secondaryMenu}
        </div>
      </div>
    </dialog>
  );
}
