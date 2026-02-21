import { useState } from 'react';

export default function AdminLogin({ apiBase, onLogin, t }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${apiBase}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || t.adminLogin.fail);
        return;
      }

      onLogin(data.token);
    } catch (error) {
      setMessage(t.adminLogin.failNow);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container py-5">
      <div className="reservation-box mx-auto" style={{ maxWidth: '520px' }}>
        <h2 className="section-title mb-3">{t.adminLogin.title}</h2>
        <p className="text-light-emphasis mb-4">{t.adminLogin.subtitle}</p>
        <form onSubmit={submit}>
          <div className="mb-3">
            <input
              className="form-control"
              type="email"
              placeholder={t.adminLogin.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <input
              className="form-control"
              type="password"
              placeholder={t.adminLogin.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-warning w-100" type="submit" disabled={loading}>
            {loading ? t.adminLogin.loading : t.adminLogin.submit}
          </button>
        </form>
        {message && <div className="alert alert-danger mt-3 mb-0">{message}</div>}
      </div>
    </section>
  );
}
