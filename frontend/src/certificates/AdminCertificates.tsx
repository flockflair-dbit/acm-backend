import { ChangeEvent, FormEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import AdminLayout from '../admin/AdminLayout';
import {
  createEvent,
  deleteEvent,
  listAdminEvents,
  saveAttendance,
  updateEvent,
  uploadTemplate,
} from './api';
import { downloadCertificate } from './renderCertificate';
import type { CertificateEvent, OverlayConfig } from './types';

const FONT_OPTIONS = [
  "Georgia, 'Times New Roman', serif",
  'Times New Roman, Times, serif',
  'Palatino, Palatino Linotype, serif',
  'Garamond, serif',
  'Arial, Helvetica, sans-serif',
];

const inputClass =
  'w-full rounded border border-stroke bg-white py-3 px-4.5 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';

function attendeesToText(event: CertificateEvent): string {
  return (event.attendees || []).map((row) => `${row.acmId}, ${row.name}`).join('\n');
}

const AdminCertificates = () => {
  const [events, setEvents] = useState<CertificateEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [overlay, setOverlay] = useState<OverlayConfig>({
    xPercent: 50,
    yPercent: 46.5,
    fontSizePercent: 4.4,
    color: '#1b365d',
    fontFamily: FONT_OPTIONS[0],
    fontWeight: '700',
  });
  const [attendance, setAttendance] = useState('');
  const [previewWidth, setPreviewWidth] = useState(0);
  const previewRef = useRef<HTMLImageElement>(null);

  const selected = events.find((event) => event.id === selectedId) || null;

  const loadEvents = async (keepId?: string | null) => {
    const data = await listAdminEvents();
    setEvents(data);
    const nextId = keepId && data.some((event) => event.id === keepId) ? keepId : data[0]?.id || null;
    setSelectedId(nextId);
    return data;
  };

  const applyEvent = (event: CertificateEvent | undefined) => {
    if (!event) return;
    setTitle(event.title);
    setDate(event.date);
    setDescription(event.description);
    setOverlay(event.overlay);
    setAttendance(attendeesToText(event));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadEvents();
        if (!cancelled && data[0]) applyEvent(data[0]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selected) applyEvent(selected);
  }, [selectedId]);

  const flash = (text: string) => {
    setMessage(text);
    setError(null);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    await run(async () => {
      const created = await createEvent({
        title: newTitle,
        date: newDate,
        description: newDescription,
      });
      setNewTitle('');
      setNewDate('');
      setNewDescription('');
      const data = await loadEvents(created.id);
      const next = data.find((item) => item.id === created.id);
      if (next) applyEvent(next);
      flash('Event created. Upload a template and add attendance next.');
    });
  };

  const handleSaveDetails = async () => {
    if (!selected) return;
    await run(async () => {
      const updated = await updateEvent(selected.id, { title, date, description, overlay });
      setEvents((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      flash('Event details and name placement saved.');
    });
  };

  const handleSaveAttendance = async () => {
    if (!selected) return;
    await run(async () => {
      const updated = await saveAttendance(selected.id, attendance);
      setEvents((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      setAttendance(attendeesToText(updated));
      flash(`Saved ${updated.attendeeCount} attendee${updated.attendeeCount === 1 ? '' : 's'}.`);
    });
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!selected || !file) return;
    await run(async () => {
      const updated = await uploadTemplate(selected.id, file);
      setEvents((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      flash('Template uploaded. Click the preview to place the member name.');
    });
    event.target.value = '';
  };

  const handleCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setAttendance(text);
    event.target.value = '';
  };

  const handlePreviewClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = Number((((event.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const yPercent = Number((((event.clientY - rect.top) / rect.height) * 100).toFixed(2));
    setOverlay((current) => ({ ...current, xPercent, yPercent }));
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete "${selected.title}" and its template?`)) return;
    await run(async () => {
      await deleteEvent(selected.id);
      const data = await loadEvents();
      if (data[0]) applyEvent(data[0]);
      else {
        setSelectedId(null);
        setTitle('');
        setDate('');
        setDescription('');
        setAttendance('');
      }
      flash('Event deleted.');
    });
  };

  const handleSampleDownload = async () => {
    if (!selected?.templateUrl) return;
    await run(async () => {
      await downloadCertificate(
        selected.templateUrl as string,
        'Sample Member Name',
        overlay,
        `${selected.title}-sample-certificate.png`,
      );
    });
  };

  return (
    <AdminLayout>
      <Breadcrumb pageName="Manage Certificates" />

      <p className="mb-6 text-sm">
        Create an event, upload a Canva or Photoshop certificate template, click where the member
        name should appear, then paste the ACM IDs of people who attended. Only those IDs can
        generate a certificate.
      </p>

      {(message || error) && (
        <div
          className={`mb-6 rounded-sm border px-4 py-3 text-sm ${
            error
              ? 'border-meta-1/40 bg-meta-1/10 text-meta-1'
              : 'border-meta-3/40 bg-meta-3/10 text-black dark:text-white'
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <form
            onSubmit={(event) => void handleCreate(event)}
            className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">New event</h3>
            </div>
            <div className="flex flex-col gap-4 p-6">
              <input
                required
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Event title"
                className={inputClass}
              />
              <input
                type="date"
                value={newDate}
                onChange={(event) => setNewDate(event.target.value)}
                className={inputClass}
              />
              <textarea
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="Short description"
                rows={3}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded bg-primary py-3 font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50"
              >
                Create event
              </button>
            </div>
          </form>

          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">Events</h3>
            </div>
            <div className="p-3">
              {loading ? (
                <p className="px-3 py-4 text-sm">Loading...</p>
              ) : events.length === 0 ? (
                <p className="px-3 py-4 text-sm">No events yet.</p>
              ) : (
                events.map((event) => (
                  <button
                    type="button"
                    key={event.id}
                    onClick={() => setSelectedId(event.id)}
                    className={`mb-2 w-full rounded px-4 py-3 text-left text-sm ${
                      event.id === selectedId
                        ? 'bg-primary text-white'
                        : 'bg-gray text-black hover:bg-primary/10 dark:bg-meta-4 dark:text-white'
                    }`}
                  >
                    <span className="block font-medium">{event.title}</span>
                    <span className="block text-xs opacity-80">
                      {event.attendeeCount} attendee{event.attendeeCount === 1 ? '' : 's'}
                      {event.templateUrl ? '' : ' · no template'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-8">
          {!selected ? (
            <div className="rounded-sm border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
              Create an event to upload a template.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <section className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">Event details</h3>
                  <button type="button" onClick={() => void handleDelete()} className="text-sm text-meta-1">
                    Delete
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                  <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className={inputClass}
                  />
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    className={`${inputClass} md:col-span-2`}
                  />
                </div>
              </section>

              <section className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">Certificate template</h3>
                </div>
                <div className="p-6">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(event) => void handleUpload(event)}
                    className="mb-4 w-full cursor-pointer rounded-lg border-[1.5px] border-stroke file:mr-5 file:border-0 file:bg-whiter file:px-5 file:py-3 dark:border-form-strokedark dark:bg-form-input"
                  />
                  {selected.templateUrl ? (
                    <>
                      <p className="mb-3 text-sm">Click the preview to place the member name.</p>
                      <div
                        className="relative mb-4 inline-block w-full cursor-crosshair overflow-hidden rounded border border-stroke dark:border-strokedark"
                        onClick={handlePreviewClick}
                      >
                        <img
                          ref={previewRef}
                          src={selected.templateUrl}
                          alt="Certificate template"
                          className="block w-full"
                          onLoad={() => setPreviewWidth(previewRef.current?.clientWidth || 0)}
                        />
                        <span
                          className="pointer-events-none absolute whitespace-nowrap"
                          style={{
                            left: `${overlay.xPercent}%`,
                            top: `${overlay.yPercent}%`,
                            transform: 'translate(-50%, -50%)',
                            color: overlay.color,
                            fontFamily: overlay.fontFamily,
                            fontWeight: overlay.fontWeight,
                            fontSize: previewWidth
                              ? `${(overlay.fontSizePercent / 100) * previewWidth}px`
                              : '24px',
                          }}
                        >
                          Sample Member Name
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="text-sm">
                          Font size
                          <input
                            type="range"
                            min="1.5"
                            max="8"
                            step="0.1"
                            value={overlay.fontSizePercent}
                            onChange={(event) =>
                              setOverlay((current) => ({
                                ...current,
                                fontSizePercent: Number(event.target.value),
                              }))
                            }
                            className="mt-2 w-full"
                          />
                        </label>
                        <label className="text-sm">
                          Name color
                          <input
                            type="color"
                            value={overlay.color}
                            onChange={(event) =>
                              setOverlay((current) => ({ ...current, color: event.target.value }))
                            }
                            className="mt-2 h-10 w-full"
                          />
                        </label>
                        <label className="text-sm md:col-span-2">
                          Font
                          <select
                            value={overlay.fontFamily}
                            onChange={(event) =>
                              setOverlay((current) => ({ ...current, fontFamily: event.target.value }))
                            }
                            className={`${inputClass} mt-2`}
                          >
                            {FONT_OPTIONS.map((font) => (
                              <option key={font} value={font}>
                                {font.split(',')[0]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleSaveDetails()}
                          className="rounded bg-primary px-6 py-3 font-medium text-white hover:bg-opacity-90"
                        >
                          Save details & placement
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleSampleDownload()}
                          className="rounded border border-stroke px-6 py-3 font-medium text-black dark:border-strokedark dark:text-white"
                        >
                          Download sample
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm">Upload a PNG, JPG, WEBP, or SVG exported from Canva or Photoshop.</p>
                  )}
                </div>
              </section>

              <section className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">Attendance</h3>
                </div>
                <div className="p-6">
                  <p className="mb-3 text-sm">
                    One person per line as <code>ACM001, Full Name</code>. Only these IDs can
                    download a certificate.
                  </p>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={(event) => void handleCsv(event)}
                    className="mb-4 w-full cursor-pointer text-sm"
                  />
                  <textarea
                    value={attendance}
                    onChange={(event) => setAttendance(event.target.value)}
                    rows={8}
                    placeholder={'ACM001, Test Member\nACM002, Demo Student'}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleSaveAttendance()}
                    className="mt-4 rounded bg-primary px-6 py-3 font-medium text-white hover:bg-opacity-90"
                  >
                    Save attendance
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCertificates;
