import { useState } from 'react';

const initialState = {
  name: '',
  phone: '',
  guests: 2,
  date: '',
  time: '',
  note: ''
};

export default function ReservationForm({ apiBase, t, panelImage }) {
  const [formData, setFormData] = useState(initialState);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${apiBase}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.reservation.failCreate);
      }

      setStatus({ type: 'success', message: t.reservation.success });
      setFormData(initialState);
    } catch (error) {
      setStatus({ type: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-showcase">
      <aside className="booking-photo-panel" style={panelImage ? { backgroundImage: `url('${panelImage}')` } : undefined}>
        <div className="booking-photo-overlay" />
      </aside>

      <form className="reservation-box booking-form" onSubmit={handleSubmit}>
        <h3 className="mb-3">{t.reservation.title}</h3>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="input-with-icon">
              <span className="form-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="form-icon-svg"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" fill="currentColor" /></svg>
              </span>
              <input className="form-control" name="name" placeholder={t.reservation.fullName} value={formData.name} onChange={handleChange} required />
            </div>
          </div>
          <div className="col-md-6">
            <div className="input-with-icon">
              <span className="form-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="form-icon-svg"><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.6 19.6 0 0 1 3.1 6.2 2 2 0 0 1 5.1 4h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2l-1.2 1.2a16 16 0 0 0 6.3 6.3l1.2-1.2a2 2 0 0 1 2-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9Z" fill="currentColor" /></svg>
              </span>
              <input className="form-control" name="phone" placeholder={t.reservation.phone} value={formData.phone} onChange={handleChange} required />
            </div>
          </div>
          <div className="col-md-4">
            <div className="input-with-icon">
              <span className="form-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="form-icon-svg"><path d="M16 11a4 4 0 1 0-3.9-4 4 4 0 0 0 3.9 4Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c-2.7 0-8 1.35-8 4v2h16v-2c0-2.65-5.3-4-8-4Zm-8 1c-2.7 0-5 1.34-5 3v2h3v-2a4.88 4.88 0 0 1 2.3-3Z" fill="currentColor" /></svg>
              </span>
              <select className="form-select" name="guests" value={formData.guests} onChange={handleChange} required>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((count) => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? t.reservation.personSingular : t.reservation.personPlural}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-4">
            <div className="input-with-icon">
              <span className="form-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="form-icon-svg"><path d="M7 2h2v3H7Zm8 0h2v3h-2ZM4 5h16a1 1 0 0 1 1 1v13a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a1 1 0 0 1 1-1Zm0 5v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9Z" fill="currentColor" /></svg>
              </span>
              <input className="form-control" name="date" type="date" value={formData.date} onChange={handleChange} required />
            </div>
          </div>
          <div className="col-md-4">
            <div className="input-with-icon">
              <span className="form-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="form-icon-svg"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 11h5v-2h-3V7h-2Z" fill="currentColor" /></svg>
              </span>
              <input className="form-control" name="time" type="time" value={formData.time} onChange={handleChange} required />
            </div>
          </div>
          <div className="col-12">
            <div className="input-with-icon input-with-icon-textarea">
              <span className="form-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="form-icon-svg"><path d="m3 17.25 9.2-9.2 3.75 3.75-9.2 9.2L3 21Zm14.7-9.95 1.8-1.8a1 1 0 0 0 0-1.4l-1.4-1.4a1 1 0 0 0-1.4 0l-1.8 1.8Z" fill="currentColor" /></svg>
              </span>
              <textarea className="form-control" name="note" placeholder={t.reservation.note} value={formData.note} onChange={handleChange} rows="3" />
            </div>
          </div>
        </div>
        <button className="btn btn-warning mt-3 px-4" type="submit" disabled={loading}>
          {loading ? t.reservation.sending : t.reservation.submit}
        </button>
        {status.message && <div className={`alert alert-${status.type} mt-3 mb-0`}>{status.message}</div>}
      </form>
    </div>
  );
}
