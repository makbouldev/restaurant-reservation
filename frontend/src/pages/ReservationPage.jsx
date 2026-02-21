import ReservationForm from '../components/ReservationForm';
import reservationBackgroundImage from '../assets/reservation-background.jpg';

export default function ReservationPage({ t, apiBase }) {
  return (
    <section className="container py-5">
      <h2 className="section-title mb-4">{t.app.reservationTitle}</h2>
      <ReservationForm apiBase={apiBase} t={t} panelImage={reservationBackgroundImage} />
    </section>
  );
}
