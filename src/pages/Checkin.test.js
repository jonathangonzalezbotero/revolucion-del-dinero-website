import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import Checkin from './Checkin';

const QUEUE_KEY = 'rdd-checkin-pendientes';

function renderCheckin(search = '?prueba=1') {
  window.history.replaceState({}, '', `/checkin${search}`);
  return render(
    <HelmetProvider>
      <Checkin />
    </HelmetProvider>
  );
}

async function llenarYEnviar() {
  await userEvent.type(screen.getByLabelText(/nombre completo/i), 'Ana Pérez');
  await userEvent.type(screen.getByLabelText(/correo/i), 'ana@example.com');
  await userEvent.type(screen.getByLabelText(/^teléfono/i), '0412345678');
  await userEvent.click(screen.getByRole('button', { name: /confirmar asistencia/i }));
}

beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers({ advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
  delete global.fetch;
});

test('fuera de fecha y sin ?prueba=1 no muestra el formulario', () => {
  renderCheckin('');
  // La fecha del evento es fija; el test corre otro día, así que debe verse el aviso.
  // (Si algún día corre exactamente el 12/09/2026 en Brisbane, este test no aplica.)
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Brisbane' }).format(new Date());
  if (hoy === '2026-09-12') return;
  expect(screen.getByText(/solo está disponible el día del evento/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /confirmar asistencia/i })).not.toBeInTheDocument();
});

test('envío exitoso muestra Listo sin dejar nada en la cola', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
  renderCheckin();
  await llenarYEnviar();

  expect(await screen.findByText(/^Listo, Ana\.$/)).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const body = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(body).toMatchObject({ nombre: 'Ana Pérez', email: 'ana@example.com', tel: '0412345678', empresa: '' });
  expect(typeof body.startedAt).toBe('number');
  expect(window.localStorage.getItem(QUEUE_KEY)).toBeNull();
});

test('sin conexión: muestra Listo igual y guarda el envío para reintentar', async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  renderCheckin();
  await llenarYEnviar();

  expect(await screen.findByText(/^Listo, Ana\.$/)).toBeInTheDocument();
  const cola = JSON.parse(window.localStorage.getItem(QUEUE_KEY));
  expect(cola).toHaveLength(1);
  expect(cola[0]).toMatchObject({ email: 'ana@example.com' });
});

test('al volver la conexión se reintenta la cola y se vacía', async () => {
  window.localStorage.setItem(
    QUEUE_KEY,
    JSON.stringify([{ nombre: 'Luis Gómez', email: 'luis@example.com', tel: '0412000000', empresa: '', startedAt: 1 }])
  );
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
  renderCheckin();

  // Al montar se intenta vaciar la cola de una vez.
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(window.localStorage.getItem(QUEUE_KEY)).toBeNull());
  expect(JSON.parse(global.fetch.mock.calls[0][1].body).email).toBe('luis@example.com');
});

test('un 400 devuelve el error a la pantalla y no encola', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 400,
    json: async () => ({ error: 'Revisa tu nombre, correo y teléfono.' }),
  });
  renderCheckin();
  await llenarYEnviar();

  expect(await screen.findByRole('alert')).toHaveTextContent(/revisa tu nombre/i);
  expect(screen.getByRole('button', { name: /confirmar asistencia/i })).toBeInTheDocument();
  expect(window.localStorage.getItem(QUEUE_KEY)).toBeNull();
});
