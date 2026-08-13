export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-grid">
        <div>
          <a href="/" className="brand-mark">Crece<span>con</span>IA</a>
          <p className="footer-note">IA aplicada con criterio, desde aprender hasta implementar.</p>
        </div>
        <div className="footer-links" aria-label="Explorar CrececonIA">
          <a href="/aprender">Aprender</a>
          <a href="/mentoria">Mentoría</a>
          <a href="/implementacion">Implementación</a>
          <a href="/ebooks">Ebooks</a>
          <a href="/centro">Centro de conocimiento</a>
          <a href="/protocolo-bpi">Método BPI</a>
          <a href="/ia">Enlace para Instagram</a>
        </div>
        <div className="footer-contact">
          <span>¿No sabes por dónde empezar?</span>
          <a href="/ia">Elige tu siguiente paso →</a>
        </div>
      </div>
      <div className="site-container footer-bottom"><span>© 2026 CrececonIA</span><span>Santiago · Chile</span></div>
    </footer>
  );
}
