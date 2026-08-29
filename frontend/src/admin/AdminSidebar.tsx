import { useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../images/logo/logo.svg';
import { adminLogout } from './session';

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const linkClass = (active: boolean) =>
  `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
    active ? 'bg-graydark dark:bg-meta-4' : ''
  }`;

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }: AdminSidebarProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target as Node) || trigger.current.contains(target as Node)) {
        return;
      }
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <NavLink to="/admin">
          <img src={Logo} alt="ACM DBIT" />
        </NavLink>
        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="block lg:hidden"
          aria-label="Close sidebar"
        >
          <svg className="fill-current" width="20" height="18" viewBox="0 0 20 18" fill="none">
            <path d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z" fill="" />
          </svg>
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
          <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">ADMIN</h3>
          <ul className="mb-6 flex flex-col gap-1.5">
            <li>
              <NavLink to="/admin" end className={linkClass(pathname === '/admin')}>
                <i className="fa-solid fa-gauge" style={{ width: '18px' }}></i>
                Admin panel
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/certificates"
                className={linkClass(pathname.includes('/admin/certificates'))}
              >
                <i className="fa-solid fa-file-arrow-up" style={{ width: '18px' }}></i>
                Manage Certificates
              </NavLink>
            </li>
          </ul>

          <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">SITE</h3>
          <ul className="flex flex-col gap-1.5">
            <li>
              <NavLink to="/certificate" className={linkClass(false)}>
                <i className="fa-solid fa-arrow-left" style={{ width: '18px' }}></i>
                Back to member site
              </NavLink>
            </li>
            <li>
              <button type="button" onClick={handleLogout} className={`${linkClass(false)} w-full text-left`}>
                <i className="fa-solid fa-right-from-bracket" style={{ width: '18px' }}></i>
                Sign out
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
