import { Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import PageTitle from '../components/PageTitle';
import AdminLayout from './AdminLayout';

const AdminPanel = () => {
  return (
    <AdminLayout>
      <PageTitle title="Admin Panel | ACM DBIT" />
      <Breadcrumb pageName="Admin panel" />
      <p className="mb-8 text-sm">
        This area is only for club admins. Members use the Certificates page to generate their own
        certificates.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link
          to="/admin/certificates"
          className="rounded-sm border border-stroke bg-white p-6 shadow-default hover:border-primary dark:border-strokedark dark:bg-boxdark"
        >
          <i className="fa-solid fa-file-arrow-up mb-4 text-2xl text-primary"></i>
          <h3 className="text-lg font-semibold text-black dark:text-white">Manage Certificates</h3>
          <p className="mt-2 text-sm">
            Create events, upload Canva or Photoshop templates, place member names, and set who
            attended.
          </p>
        </Link>
      </div>
    </AdminLayout>
  );
};

export default AdminPanel;
