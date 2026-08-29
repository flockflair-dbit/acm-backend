import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../images/logo/logo.svg';
import LogoDark from '../images/logo/logo-dark.svg';
import PageTitle from '../components/PageTitle';
import { adminLogin } from './session';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const redirectTo =
    (location.state as { from?: string } | null)?.from || '/admin';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminLogin(password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <PageTitle title="Admin Sign In | ACM DBIT" />
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
            <Link to="/" className="mb-2 inline-block">
              <img className="hidden dark:block" src={Logo} alt="ACM DBIT" />
              <img className="dark:hidden" src={LogoDark} alt="ACM DBIT" />
            </Link>
            <h2 className="text-xl font-bold text-black dark:text-white">Admin panel</h2>
            <p className="mt-1 text-sm">Sign in to manage certificates, templates, and attendance.</p>
          </div>
          <form onSubmit={(event) => void handleSubmit(event)} className="p-6">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Admin password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-stroke bg-transparent py-4 px-6 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            />
            {error && <p className="mt-3 text-sm font-medium text-meta-1">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="mt-6 w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white hover:bg-opacity-90 disabled:bg-opacity-50"
            >
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
            <p className="mt-6 text-center text-sm">
              <Link to="/certificate" className="text-primary">
                Back to certificates
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
