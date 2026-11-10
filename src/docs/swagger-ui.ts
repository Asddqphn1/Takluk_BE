export function getSwaggerHtml(openapiUrl: string = '/openapi.json'): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Takluk API — Dokumentasi Swagger UI</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23462B92'><path d='M12 2L1 7l11 5 9-4.09V17h2V7L12 2z'/></svg>">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #462B92;
      --primary-dark: #372175;
      --accent: #F89C05;
      --ink: #2A1A5E;
      --bg: #FAF9FD;
      --tint: #EFEAFB;
      --line: #E7E4F0;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg);
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--ink);
    }

    /* Branded Header */
    .takluk-header {
      background: linear-gradient(135deg, #462B92 0%, #6B47C9 100%);
      color: #FFFFFF;
      padding: 24px 32px;
      box-shadow: 0 4px 20px rgba(70, 43, 146, 0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .takluk-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .takluk-logo {
      font-size: 32px;
      line-height: 1;
    }

    .takluk-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .takluk-subtitle {
      margin: 2px 0 0 0;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.85);
      font-weight: 400;
    }

    .takluk-badges {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge-pill {
      background-color: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #FFFFFF;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      transition: background-color 0.2s ease;
    }

    .badge-pill:hover {
      background-color: rgba(255, 255, 255, 0.25);
    }

    .badge-orange {
      background-color: var(--accent);
      border-color: var(--accent);
      color: #FFFFFF;
    }

    /* Swagger Container Customization */
    #swagger-ui {
      max-width: 1200px;
      margin: 20px auto 60px auto;
      padding: 0 20px;
    }

    .swagger-ui .topbar {
      display: none;
    }

    .swagger-ui .info {
      margin: 24px 0 32px 0;
      padding: 24px 28px;
      background: #FFFFFF;
      border-radius: 20px;
      border: 1px solid var(--line);
      box-shadow: 0 2px 12px rgba(70, 43, 146, 0.05);
    }

    .swagger-ui .info .title {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      color: var(--ink);
    }

    .swagger-ui .info a {
      color: var(--primary);
    }

    .swagger-ui .opblock-tag {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      color: var(--ink);
      border-bottom: 2px solid var(--tint);
      margin: 20px 0 10px 0;
      padding-bottom: 8px;
    }

    .swagger-ui .opblock {
      border-radius: 14px;
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
      margin-bottom: 12px;
      border-width: 1px;
    }

    .swagger-ui .btn.authorize {
      background-color: var(--primary);
      border-color: var(--primary);
      color: #FFFFFF;
      border-radius: 12px;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      padding: 8px 20px;
      transition: all 0.2s ease;
    }

    .swagger-ui .btn.authorize:hover {
      background-color: var(--primary-dark);
      border-color: var(--primary-dark);
    }

    .swagger-ui .btn.authorize svg {
      fill: #FFFFFF;
    }

    .swagger-ui .btn.execute {
      background-color: var(--primary);
      border-color: var(--primary);
      color: #FFFFFF;
      border-radius: 10px;
      font-weight: 600;
    }

    .swagger-ui .btn.execute:hover {
      background-color: var(--primary-dark);
    }

    /* Method Badges */
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background-color: #462B92;
      border-radius: 8px;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background-color: #0284C7;
      border-radius: 8px;
    }

    .swagger-ui select,
    .swagger-ui input[type=text] {
      border-radius: 8px;
      border: 1px solid var(--line);
      font-family: inherit;
    }
  </style>
</head>
<body>
  <header class="takluk-header">
    <div class="takluk-brand">
      <div class="takluk-logo">🎓</div>
      <div>
        <h1 class="takluk-title">Takluk — RuangKuliah Hub</h1>
        <p class="takluk-subtitle">Interactive REST API Documentation • Panam, Pekanbaru</p>
      </div>
    </div>
    <div class="takluk-badges">
      <span class="badge-pill badge-orange">⚡ Hono.js + Bun</span>
      <span class="badge-pill">🛡️ Anti-Piracy DRM</span>
      <a class="badge-pill" href="/openapi.json" target="_blank" download>
        ⬇️ OpenAPI JSON
      </a>
    </div>
  </header>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "${openapiUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        persistAuthorization: true,
      });
    };
  </script>
</body>
</html>`;
}

