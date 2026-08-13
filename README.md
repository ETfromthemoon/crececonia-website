# CrececonIA

Sitio web de CrececonIA, construido con Next.js y desplegado mediante la
integración GitHub → Vercel.

## Flujo de revisión

La revisión visual se realiza únicamente desde el Pull Request en GitHub,
usando el enlace `Preview` del deployment generado por Vercel. No se usan
servidores locales ni URLs de localhost como entregable visual.

## Validación

```bash
npm test
npm run build
```

Los cambios que llegan a la rama principal siguen el flujo de producción
configurado en Vercel.
