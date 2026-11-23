import { MARKETPLACE_COMMISSION_BPS, MARKETPLACE_SELLER_TERMS_VERSION } from "@/lib/marketplace/commission";

export default function SellerConditions() {
  return <main className="site-container" style={{ maxWidth: 760, paddingTop: 100, paddingBottom: 100 }}>
    <p className="eyebrow">Marketplace de ebooks</p>
    <h1>Condiciones para autores · versión {MARKETPLACE_SELLER_TERMS_VERSION}</h1>
    <p>CrececonIA recibe solicitudes para vender ebooks de IA, tecnología y negocios en Chile, con precios en pesos chilenos. Crear un perfil o subir un archivo no garantiza su publicación: el equipo revisa identidad, situación tributaria, derechos y contenido antes de activar ventas.</p>
    <h2>Precio y liquidación</h2>
    <p>CrececonIA cobra una comisión del {MARKETPLACE_COMMISSION_BPS / 100} % sobre el precio pagado, excluido el IVA de la venta cuando corresponda. A la comisión se le aplica el 19 % de IVA por el servicio de intermediación. El cargo total se descuenta de la liquidación al confirmarse el pago. El costo efectivo de Flow corresponde al vendedor y se descuenta al conciliar el pago.</p>
    <p>El documento tributario de la venta se emite según el régimen del autor, el modelo de emisión aplicable y el medio de pago. CrececonIA registra manualmente su referencia y respalda su comisión por separado con el documento que corresponda.</p>
    <h2>Obligaciones del autor</h2>
    <p>El autor declara que tiene derechos suficientes sobre el texto, la portada y cualquier material incluido, y que los datos de identidad y tributarios entregados son correctos. Debe avisar de cambios relevantes. La plataforma puede pedir antecedentes adicionales y pausar un libro ante reclamos fundados o incumplimientos.</p>
    <h2>Revisión y entrega</h2>
    <p>Los archivos se guardan de forma privada para revisión. El autor autoriza su entrega digital a compradores cuando el libro esté aprobado y el pago se confirme. Las solicitudes de reembolso, reclamos y correcciones se revisarán según la política informada al comprador en la compra.</p>
    <h2>Datos y contacto</h2>
    <p>El correo, RUT y nombre legal se usan para acceso, verificación, operación de ventas y registros contables. No se muestran en el catálogo público. Para consultas sobre publicación o datos, escribe a <a href="mailto:sergio@crececonia.cl">sergio@crececonia.cl</a>.</p>
    <p>Antes de publicar un libro, CrececonIA verifica la identidad y situación tributaria del autor, los derechos declarados, el contenido y los archivos. Un administrador aprueba la publicación final; el autor no puede publicar directamente.</p>
    <a href="/ebooks/vender">Volver al espacio de autores</a>
  </main>;
}
