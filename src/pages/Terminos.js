/**
 * /terminos — Términos y política de reembolso.
 *
 * Existe por protección, no por marketing. Stripe exige una política de reembolso
 * accesible: sin ella, una disputa de $250 se pierde por defecto.
 *
 * La garantía de reembolso vive ACÁ y solo acá. No va en el hero de /bootcamp, ni en una
 * insignia, ni en una sección propia, ni como bullet de "qué incluye", ni cerca de los
 * botones: Jonathan la anuncia él mismo desde el escenario y quiere que llegue de su voz.
 * El único enlace a esta página está en el pie.
 *
 * ⚠️ PENDIENTE PARA JONATHAN: la ventana de la garantía (redactada abajo como "hasta el
 * final del día del Bootcamp") es la redacción conservadora que se puso por defecto.
 * Confirma que coincide con lo que anuncias desde el escenario y ajústala si no.
 */

import './Bootcamp.css';
import './Circulo.css';
import Logo from '../assets/images/logo.webp';
import Seo from '../components/Seo';
import { TERMINOS_TITLE, TERMINOS_DESCRIPTION, DISCLAIMER_AFSL } from '../seoData';
import { FECHA_LARGA, HORARIO, LUGAR, PRECIO_INDIVIDUAL, PRECIO_PAREJA, COBRO_INDIVIDUAL, COBRO_PAREJA, CURSO_NOMBRE } from '../config/bootcamp';
import { PRECIOS, NUMERO_CUOTAS, RECARGO_CUOTAS_PCT, CURSO_NEGOCIO, RITMO_CONTENIDO, EVENTO_MARZO, SESIONES_1A1 } from '../config/circulo';

// ⚠️ TODO PARA JONATHAN: no había ninguna dirección de contacto en el repositorio, así
// que este valor es un supuesto. Cámbialo por la dirección real que lees a diario —
// Stripe espera poder contactarte por acá en una disputa.
const CONTACTO = 'hola@revoluciondeldinero.com';

function Terminos() {
  return (
    <div className="page-bootcamp">
      <Seo title={TERMINOS_TITLE} description={TERMINOS_DESCRIPTION} path="/terminos" />

      <div className="bc-ann">
        Revolución del Dinero · <b>Términos y política de reembolso</b>
      </div>

      <section className="bc-legal">
        <div className="wrap">
          <div className="bc-legal-inner">
          <span className="bc-eyebrow">Lo legal, en lenguaje llano</span>
          <h1 style={{ marginTop: 16 }}>Términos y política de reembolso</h1>
          <p className="bc-updated">Última actualización: septiembre de 2026</p>

          <p>
            Esta página está escrita en lenguaje llano a propósito: son las condiciones de
            lo que compras, y tienes derecho a entenderlas sin abogado. Si algo no te queda
            claro, escribe a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> y te respondemos.
          </p>

          <h2>Quién te está vendiendo</h2>
          <p>
            Revolución del Dinero es un proyecto de educación financiera de{' '}
            <strong>Jonathan González Botero</strong>, que opera bajo su ABN personal en
            Australia, con base en la Gold Coast, Queensland.
          </p>

          <h2>Qué compras, y qué no</h2>
          <p>
            Lo que compras es <strong>educación y formación</strong>: aprender a leer tus
            propios números, ordenar tus deudas, revisar tus hábitos, organizar tus cuentas
            y decidir con criterio. Se trabaja con tu presupuesto, con tus deudas y con tus
            hábitos.
          </p>
          <p>
            <strong>No es asesoría sobre productos financieros</strong> y no debe tomarse
            como tal. Jonathan González Botero no está licenciado para dar asesoría sobre
            productos financieros en Australia y no la da. Nada de lo que se enseñe en el
            Bootcamp, en el Círculo Presencial, en los eventos presenciales o en esta web
            constituye una recomendación personal sobre ningún producto financiero. Eso
            incluye las sesiones uno a uno: son para trabajar tu presupuesto, tus deudas,
            tus hábitos y cómo tienes organizadas tus cuentas, no para decidir qué producto
            financiero contratar. Para ese tipo de decisiones tienes que acudir a un
            profesional licenciado.
          </p>

          <div className="cir-disclaimer" style={{ margin: '18px 0' }}>
            <b>Aviso importante</b>
            {DISCLAIMER_AFSL}
          </div>
          <p>
            Los resultados dependen de lo que cada persona haga con lo que aprende. No
            prometemos ni garantizamos ningún resultado económico.
          </p>

          <h2>El Bootcamp Financiero: qué es y qué cuesta</h2>
          <ul>
            <li><strong>Fecha y horario:</strong> {FECHA_LARGA}, de {HORARIO}.</li>
            <li><strong>Lugar:</strong> {LUGAR}. La dirección exacta se envía por correo antes del día.</li>
            <li><strong>Precios anunciados:</strong> ${PRECIO_INDIVIDUAL} AUD la entrada individual y ${PRECIO_PAREJA} AUD la entrada para dos personas.</li>
            <li>
              <strong>Lo que se cobra:</strong> ${COBRO_INDIVIDUAL} AUD y ${COBRO_PAREJA} AUD.
              Esa diferencia es la comisión de la pasarela de pago y no se queda en
              Revolución del Dinero.
            </li>
            <li>
              <strong>Qué incluye:</strong> la jornada completa, el material de trabajo del
              día y el acceso al curso «{CURSO_NOMBRE}».
            </li>
            <li>
              <strong>Qué no incluye:</strong> el almuerzo. Hay pausa para almorzar, pero la
              comida la pone cada uno. Tampoco incluye acceso a ninguna comunidad ni a ningún
              programa de acompañamiento.
            </li>
          </ul>

          <h2>Cómo pedir tu dinero de vuelta: Bootcamp</h2>
          <p>
            <strong>Si asistes y el día no te sirvió, te devolvemos tu dinero.</strong>{' '}
            Para pedirlo solo tienes que decírnoslo en persona el día del Bootcamp, o
            escribirnos a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> antes del final de
            ese mismo día. No hay que dar explicaciones y no hay letra pequeña: el reembolso
            se hace por el mismo medio de pago con el que compraste.
          </p>
          <p>
            Te devolvemos lo que pagaste. La comisión de la pasarela te la devolvemos si la
            pasarela nos la devuelve a nosotros. Si no lo hace, esa parte no está en nuestras
            manos y te lo diremos claro.
          </p>
          <p>
            Los reembolsos salen de acá en <strong>10 días hábiles</strong> o menos. Cuánto
            tarde en aparecer en tu cuenta ya depende de tu banco.
          </p>

          <h2>Si al final no puedes ir</h2>
          <ul>
            <li>
              <strong>Puedes mandar a alguien en tu lugar.</strong> Escríbenos con su nombre
              y su teléfono y lo cambiamos sin costo.
            </li>
            <li>
              <strong>Puedes pasar tu lugar a la siguiente edición</strong> del Bootcamp,
              avisándonos antes de la fecha del evento.
            </li>
            <li>
              Si cancelas con <strong>más de 14 días</strong> de anticipación, te devolvemos
              el importe pagado. Con menos de 14 días te ofrecemos el cambio de persona o el
              pase a la siguiente edición, porque a esa altura el material y la logística ya
              están comprometidos.
            </li>
          </ul>

          <h2>Si nosotros cancelamos o aplazamos</h2>
          <p>
            Si tenemos que cancelar el Bootcamp, te devolvemos el <strong>100%</strong> de lo
            pagado, sin que tengas que pedirlo. Si lo aplazamos, puedes elegir entre
            conservar tu lugar para la nueva fecha o recibir el reembolso completo.
          </p>

          <h2>El curso «{CURSO_NOMBRE}» del Bootcamp</h2>
          <p>
            Va incluido en la compra del Bootcamp y los detalles de acceso se envían por
            correo. Es contenido educativo sobre cómo proyectar tus ingresos, gastos, deudas
            y metas a doce meses. No se reembolsa por separado: forma parte de la compra, no
            es un producto aparte.
          </p>

          <h2>El Círculo Presencial: qué es y qué cuesta</h2>
          <ul>
            <li><strong>Qué es:</strong> un programa de acompañamiento en grupo de <strong>un año</strong>, contado desde el día en que compras.</li>
            <li>
              <strong>Precios anunciados:</strong> ${PRECIOS['circulo-individual'].unico.anunciado} AUD
              individual y ${PRECIOS['circulo-pareja'].unico.anunciado} AUD para dos personas, en pago único.
            </li>
            <li>
              <strong>Lo que se cobra en pago único:</strong> ${PRECIOS['circulo-individual'].unico.cobro} AUD
              y ${PRECIOS['circulo-pareja'].unico.cobro} AUD respectivamente. La diferencia es la
              comisión de la pasarela de pago y no se queda en Revolución del Dinero.
            </li>
            <li>
              <strong>En cuotas:</strong> {NUMERO_CUOTAS} pagos mensuales de $
              {PRECIOS['circulo-individual'].cuotas.mensual} AUD (total $
              {PRECIOS['circulo-individual'].cuotas.total}) o de $
              {PRECIOS['circulo-pareja'].cuotas.mensual} AUD (total $
              {PRECIOS['circulo-pareja'].cuotas.total}). El recargo del {RECARGO_CUOTAS_PCT}% es
              por financiar el pago. <strong>La suscripción se cancela automáticamente
              después del sexto cobro</strong>: no hay un séptimo pago y no tienes que
              cancelar nada. Tu acceso es el año completo, no seis meses.
            </li>
            <li>
              <strong>Qué incluye:</strong> el Bootcamp Financiero presencial, el evento
              presencial «{EVENTO_MARZO.nombre}» ({EVENTO_MARZO.cuando}), la comunidad
              privada en Skool, el grupo privado de WhatsApp, las sesiones mensuales en
              grupo, {SESIONES_1A1} sesiones uno a uno a lo largo del año, la tarde de
              Cashflow presencial, el curso «{CURSO_NEGOCIO.nombre}» y el acceso a la Ruta
              del Revolucionario.
            </li>
            <li>
              <strong>Sobre el contenido de la Ruta del Revolucionario:</strong> se publica
              a un ritmo comprometido — {RITMO_CONTENIDO.hastaNoviembre} hasta el Bootcamp
              de noviembre de 2026, y {RITMO_CONTENIDO.desdeDiciembre} a partir de
              diciembre. Lo que se compromete es esa cadencia de publicación. No se promete
              una cantidad determinada de material ya disponible ni una fecha de
              finalización del camino.
            </li>
            <li>
              <strong>Qué no incluye:</strong> el almuerzo del Bootcamp, los desplazamientos
              a los eventos presenciales, ni ningún servicio de asesoría sobre productos
              financieros.
            </li>
            <li>
              <strong>Renovación:</strong> no hay renovación automática. Al terminar el año
              puedes renovar por <strong>la mitad</strong> del precio vigente en ese
              momento, y la renovación incluye los eventos presenciales de ese año. Si no
              renuevas, el acceso simplemente termina y no se cobra nada más.
            </li>
          </ul>

          <h2>Cómo pedir tu dinero de vuelta: Círculo Presencial</h2>
          <p>
            <strong>Tienes 14 días desde la compra para pedir el reembolso completo</strong>,
            sin dar explicaciones, incluso si ya entraste a la comunidad y participaste de
            una sesión. Escríbenos a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> y lo
            procesamos.
          </p>
          <p>
            Pasados los 14 días no devolvemos el año en curso, porque a esa altura ya hay
            fechas presenciales reservadas y trabajo hecho contigo. Pero si tu situación
            cambia de verdad — te vas del país, te cambia la visa, se te complica la vida —
            escríbenos y lo hablamos caso por caso. Podemos congelar tu acceso, pasarlo a otra
            edición o traspasarlo a otra persona. Preferimos resolverlo hablando que
            escondernos detrás de una cláusula.
          </p>
          <p>
            Si compraste <strong>en cuotas</strong> y pides el reembolso dentro de los 14
            días, se devuelve lo cobrado hasta ese momento y se cancela la suscripción de
            inmediato, sin cobros posteriores.
          </p>
          <p>
            Si tenemos que cancelar el programa, te devolvemos la parte proporcional del año
            que no se haya prestado, sin que tengas que pedirlo.
          </p>

          <h2>Las entradas de $10 a los eventos</h2>
          <p>
            Las entradas al evento del 12 de septiembre de 2026 <strong>no son
            reembolsables</strong>, porque lo recaudado en entradas se dona íntegramente a
            las familias afectadas por el terremoto del 10 de agosto de 2026 en Colombia. Si
            no puedes ir, puedes mandar a alguien en tu lugar: escríbenos y lo cambiamos.
          </p>

          <h2>Pagos</h2>
          <p>
            Los pagos se procesan a través de <strong>Stripe</strong>. No vemos ni
            almacenamos los datos de tu tarjeta en ningún momento. El cargo aparece en tu
            extracto a nombre de Revolución del Dinero.
          </p>

          <h2>Qué hacemos con tus datos</h2>
          <p>
            Usamos tu nombre, tu correo y tu teléfono para confirmarte la compra, mandarte
            los detalles del evento y contarte de las próximas ediciones. Nada más. No
            vendemos ni cedemos tus datos a nadie. Puedes darte de baja de los correos cuando
            quieras con el enlace del final de cada uno, o escribir a{' '}
            <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> para pedir que los borremos.
          </p>

          <h2>Fotos y video en los eventos</h2>
          <p>
            En los presenciales tomamos fotos y video para contar lo que pasó. Si no quieres
            aparecer, dínoslo el día del evento y listo.
          </p>

          <h2>Contacto</h2>
          <p>
            Jonathan González Botero · Gold Coast, Queensland, Australia ·{' '}
            <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>
          </p>
          </div>
        </div>
      </section>

      <footer className="bc-footer">
        <div className="wrap">
          <img src={Logo} alt="Revolución del Dinero" />
          <div>
            <a href="/bootcamp">Volver al Bootcamp</a>
          </div>
          <div className="cir-disclaimer">
            <b>Aviso importante</b>
            {DISCLAIMER_AFSL}
          </div>
          <div className="bc-cr">
            © 2026 Revolución del Dinero · Jonathan González Botero · {LUGAR}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Terminos;
