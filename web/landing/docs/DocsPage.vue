<template>
  <div class="landing-shell public-page">
    <PublicHeader />
    <main class="docs-content">
      <div class="docs-hero"><p class="eyebrow"><span /> DOCUMENTAÇÃO / SELF-HOSTED</p><h1>Seu cofre, seu host.</h1><p>Instale, configure e atualize o Atacte sem migrações automáticas ou serviços externos obrigatórios.</p></div>
      <section id="requisitos"><p class="section-index">01 / REQUISITOS</p><h2>Antes de começar.</h2><ul><li>Docker Engine 24+ e Docker Compose v2.</li><li>Um host Linux ou macOS com pelo menos 1 GB de RAM.</li><li>Um domínio ou VPN para acesso remoto via HTTPS.</li></ul></section>
      <section id="instalacao"><p class="section-index">02 / INSTALAÇÃO</p><h2>Um comando.</h2><p>O instalador baixa o Compose e o updater, cria um diretório privado e preserva o volume PostgreSQL.</p><pre><code>curl -fsSL https://atacte.vercel.app/install.sh | sh</code></pre><p>Para usar uma versão específica: <code>ATACTE_RELEASE_REF=v1.2.3 curl -fsSL https://atacte.vercel.app/install.sh | sh</code>.</p><p>Também é possível baixar <a href="https://github.com/ferforastieri/atacte/releases">Compose e imagens pelas releases</a> e executar <code>docker compose up -d</code> dentro de <code>~/.atacte</code>.</p></section>
      <section id="atualizacao"><p class="section-index">03 / ATUALIZAÇÃO</p><h2>Atualiza sem tocar no banco.</h2><p>O manager consulta a versão publicada. Administradores recebem um aviso e podem iniciar o updater; ele faz pull das imagens e recria backend/frontend sem executar Prisma migrate, db push ou apagar volumes.</p><pre><code>cd ~/.atacte
docker compose pull backend front
docker compose up -d --no-build --remove-orphans backend front</code></pre><p>Se a atualização falhar, volte para a tag SHA anterior no Compose e valide <code>curl http://localhost:3457/health</code>.</p></section>
      <section id="seguranca"><p class="section-index">04 / SEGURANÇA</p><h2>Transparência primeiro.</h2><p>A sessão usa cookie HttpOnly e proteção CSRF. Mantenha o Atacte atrás de HTTPS, não exponha PostgreSQL, limite o painel à sua rede/VPN e faça backup do volume.</p><div class="docs-callout"><strong>Risco conhecido</strong><p>A chave de cifragem atual deriva do email (SHA-256) e permanece armazenada no banco por compatibilidade. Isso não é zero-knowledge; trate o PostgreSQL como dado altamente sensível.</p></div></section>
    </main>
    <PublicFooter />
  </div>
</template>
<script setup lang="ts">
const managerUrl = import.meta.env.VITE_MANAGER_URL || '/manager/'
const PublicHeader = { template: `<header class="site-header"><a class="brand" href="/"><img src="/favicon-web.png" alt="" /><span>ATACTE<small>PRIVATE VAULT</small></span></a><nav><a href="/docs/">Documentação</a><a href="/releases/">Releases</a><a class="header-link" href="${managerUrl}">Abrir gerenciador ↗</a></nav></header>` }
const PublicFooter = { template: `<footer class="site-footer"><span>ATACTE / PRIVATE VAULT</span><span><a href="/">INÍCIO</a> · <a href="/releases/">RELEASES</a> · SELF-HOSTED</span></footer>` }
</script>
