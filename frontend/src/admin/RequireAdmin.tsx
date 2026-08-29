import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Loader from '../common/Loader';
import { verifyAdminSession } from './session';

const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    verifyAdminSession().then((ok) => {
      if (!cancelled) setAllowed(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (allowed === null) return <Loader />;
  if (!allowed) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
};

export default RequireAdmin;
