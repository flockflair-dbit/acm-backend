import { useEffect, useMemo, useState } from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import { generateCertificate, listEvents } from './api';
import { downloadCertificate, renderCertificate, slugify } from './renderCertificate';
import type { CertificateEvent, GenerateSuccess } from './types';

const ACM_ID_KEY = 'acm-certificate-id';

function formatDate(value: string): string {
  if (!value) return 'Date TBA';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const Certificates = () => {
  const [events, setEvents] = useState<CertificateEvent[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CertificateEvent | null>(null);
  const [acmId, setAcmId] = useState(() => sessionStorage.getItem(ACM_ID_KEY) || '');
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateSuccess | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listEvents();
        if (!cancelled) setEvents(data);
      } catch (err) {
        if (!cancelled) {
          setPageError(err instanceof Error ? err.message : 'Could not load events');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return events;
    return events.filter((event) =>
      [event.title, event.description, event.date].join(' ').toLowerCase().includes(needle),
    );
  }, [events, query]);

  const hasDemo = events.some((event) => event.id === 'demo-workshop');

  const closeModal = () => {
    setSelected(null);
    setResult(null);
    setPreviewUrl(null);
    setModalError(null);
    setBusy(false);
  };

  const handleGenerate = async () => {
    if (!selected) return;
    const id = acmId.trim();
    if (!id) {
      setModalError('Enter your ACM membership ID');
      return;
    }

    sessionStorage.setItem(ACM_ID_KEY, id);
    setBusy(true);
    setModalError(null);
    setResult(null);
    setPreviewUrl(null);

    try {
      const generated = await generateCertificate(selected.id, id);
      if (!generated.event.templateUrl) {
        throw new Error('This event does not have a certificate template yet');
      }
      const canvas = await renderCertificate(
        generated.event.templateUrl,
        generated.name,
        generated.event.overlay,
      );
      setResult(generated);
      setPreviewUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Could not generate the certificate');
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.event.templateUrl) return;
    setBusy(true);
    setModalError(null);
    try {
      await downloadCertificate(
        result.event.templateUrl,
        result.name,
        result.event.overlay,
        `${result.acmId}-${slugify(result.event.title)}-certificate.png`,
      );
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Could not download the certificate');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Certificates" />

      {hasDemo && (
        <div className="mb-6 rounded-sm border border-primary/30 bg-primary/5 px-5 py-4 text-sm text-black dark:text-white">
          A demo workshop is already loaded for testing. Use ACM ID <strong>ACM001</strong> (Test
          Member) to generate a certificate. <strong>ACM999</strong> is rejected because that ID
          did not attend.
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black dark:text-white">Event certificates</h3>
          <p className="mt-1 text-sm">
            Search an event, then generate a certificate with your ACM membership ID. Certificates
            are issued only if you are on that event's attendance list.
          </p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events"
            className="w-full rounded border border-stroke bg-white py-3 pl-4 pr-10 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
          />
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-body"></i>
        </div>
      </div>

      {loading ? (
        <p>Loading events...</p>
      ) : pageError ? (
        <div className="rounded-sm border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
          <p className="mb-2 font-medium text-meta-1">{pageError}</p>
          <p className="text-sm">
            Make sure the backend is running on port 3000, then refresh this page.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-sm border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
          <p>{events.length === 0 ? 'No certificate events yet.' : 'No events match your search.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => (
            <article
              key={event.id}
              className="flex h-full flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
            >
              <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                <p className="text-sm font-medium text-primary">{formatDate(event.date)}</p>
                <h4 className="mt-1 text-lg font-semibold text-black dark:text-white">{event.title}</h4>
              </div>
              <div className="flex flex-1 flex-col px-6 py-5">
                <p className="mb-5 line-clamp-3 flex-1 text-sm">
                  {event.description || 'Certificate available for members who attended this event.'}
                </p>
                <button
                  type="button"
                  disabled={!event.templateUrl}
                  onClick={() => {
                    setSelected(event);
                    setResult(null);
                    setPreviewUrl(null);
                    setModalError(null);
                  }}
                  className="inline-flex items-center justify-center rounded bg-primary px-4 py-2.5 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-40"
                >
                  {event.templateUrl ? 'Generate certificate' : 'Template not uploaded yet'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white">{selected.title}</h3>
                <p className="text-sm">{formatDate(selected.date)}</p>
              </div>
              <button type="button" onClick={closeModal} className="text-2xl leading-none" aria-label="Close">
                ×
              </button>
            </div>

            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              ACM membership ID
            </label>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={acmId}
                onChange={(event) => setAcmId(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleGenerate();
                }}
                placeholder="e.g. ACM001"
                className="w-full rounded border border-stroke bg-white py-3 px-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
              />
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={busy}
                className="inline-flex items-center justify-center whitespace-nowrap rounded bg-primary px-6 py-3 font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50"
              >
                {busy ? 'Working...' : result ? 'Regenerate' : 'Generate'}
              </button>
            </div>

            {modalError && <p className="mb-4 text-sm font-medium text-meta-1">{modalError}</p>}

            {previewUrl && result && (
              <div>
                <p className="mb-3 text-sm">
                  Certificate for <strong>{result.name}</strong> ({result.acmId})
                </p>
                <img
                  src={previewUrl}
                  alt={`Certificate for ${result.name}`}
                  className="mb-4 w-full rounded border border-stroke dark:border-strokedark"
                />
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded bg-primary px-6 py-3 font-medium text-white hover:bg-opacity-90"
                >
                  <i className="fa-solid fa-download"></i>
                  Download PNG
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default Certificates;
