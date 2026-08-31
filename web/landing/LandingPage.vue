<template>
  <div class="landing-shell">
    <header class="site-header">
      <a class="brand" href="#top" aria-label="Atacte início">
        <img src="/favicon-web.png" alt="" />
        <span>ATACTE<small>PRIVATE VAULT</small></span>
      </a>
      <nav aria-label="Navegação principal">
        <a href="#recursos">Recursos</a>
        <a href="#como-funciona">Como funciona</a>
        <a href="/docs/">Documentação</a>
        <a href="/releases/">Releases</a>
        <a class="header-link" :href="managerUrl">Abrir gerenciador <span>↗</span></a>
      </nav>
    </header>

    <main id="top">
      <section class="hero">
        <div class="hero-copy reveal">
          <p class="eyebrow"><span /> SELF-HOSTED · OPEN SOURCE · SEM RUÍDO</p>
          <h1>O lugar onde<br /><em>suas chaves descansam.</em></h1>
          <p class="hero-intro">
            Atacte reúne senhas, códigos de autenticação e notas privadas em um cofre simples de operar — no seu servidor, sob suas regras.
          </p>
          <div class="hero-actions">
            <a class="button primary" :href="managerUrl">Abrir gerenciador <span>→</span></a>
            <a class="button secondary" href="#instalacao">Ver instalação</a>
          </div>
          <div class="hero-proof" aria-label="Princípios do Atacte">
            <div><strong>01</strong><span>Local</span><small>Seus dados ficam na sua infraestrutura.</small></div>
            <div><strong>02</strong><span>Consciente</span><small>Sem promessas de segurança que o produto não cumpre.</small></div>
            <div><strong>03</strong><span>Portátil</span><small>Docker, web, mobile e desktop.</small></div>
          </div>
        </div>

        <div class="vault-stage reveal" aria-label="Ilustração de um cofre com itens protegidos">
          <div class="vault-halo halo-one" /><div class="vault-halo halo-two" />
          <div class="vault">
            <div class="vault-top"><span>AT—01</span><span>SECURE / LOCAL</span></div>
            <div class="vault-door">
              <div class="dial"><i /><b /><strong>✦</strong></div>
              <div class="vault-status"><span /> VAULT READY</div>
            </div>
            <div class="vault-drawer"><span>KEYS</span><b>••••••••••••</b><i>✓</i></div>
            <div class="vault-drawer accent"><span>TOTP</span><b>4 8 2 1 9 0</b><i>30s</i></div>
            <div class="vault-footer"><span>PRIVATE BY DESIGN</span><span>EST. 2024</span></div>
          </div>
        </div>
      </section>

      <section id="recursos" class="section resources">
        <div class="section-heading reveal"><p class="section-index">01 / O COFRE</p><h2>O essencial,<br /><em>bem guardado.</em></h2><p>Uma interface direta para as coisas que você não pode perder — nem deixar expostas.</p></div>
        <div class="feature-grid">
          <article class="feature-card reveal"><span class="feature-mark">⌘</span><h3>Senhas no lugar</h3><p>Crie, organize, pesquise e importe suas credenciais sem espalhar cópias pela nuvem.</p><small>01 / CREDENCIAIS</small></article>
          <article class="feature-card reveal"><span class="feature-mark">◌</span><h3>TOTP junto da senha</h3><p>Gere códigos de dois fatores no mesmo contexto, sem alternar entre aplicativos.</p><small>02 / AUTENTICAÇÃO</small></article>
          <article class="feature-card reveal"><span class="feature-mark">◇</span><h3>Notas privadas</h3><p>Guarde chaves de recuperação, documentos e lembretes que merecem outra camada.</p><small>03 / NOTAS</small></article>
          <article class="feature-card reveal"><span class="feature-mark">▣</span><h3>Controle de acesso</h3><p>Veja sessões, confie dispositivos e mantenha uma trilha de auditoria compreensível.</p><small>04 / SESSÕES</small></article>
        </div>
      </section>

      <section id="como-funciona" class="section manifesto">
        <p class="section-index">02 / SEM MÁGICA</p>
        <div class="manifesto-grid"><div class="manifesto-copy reveal"><p>O Atacte não tenta esconder a infraestrutura.</p><h2>Você sabe<br />onde ele roda.<br /><em>Você decide.</em></h2></div><div class="manifesto-note reveal"><span>O MODELO</span><p>O gerenciador roda com sua API e seu PostgreSQL. A landing é pública; o cofre continua no ambiente que você escolheu.</p><dl><div><dt>01</dt><dd>Suba com Docker Compose</dd></div><div><dt>02</dt><dd>Acesse pela web, mobile ou desktop</dd></div><div><dt>03</dt><dd>Atualize pela imagem versionada</dd></div></dl></div></div>
      </section>

      <section id="instalacao" class="install-section reveal"><div><p class="section-index">03 / PRIMEIRO PASSO</p><h2>Seu cofre começa<br /><em>no seu servidor.</em></h2><p>Instale com Docker em um comando. O updater interno avisa quando há uma nova release e preserva o PostgreSQL.</p><pre><code>curl -fsSL https://atacte.vercel.app/install.sh | sh</code></pre></div><div class="hero-actions"><a class="button primary" :href="managerUrl">Abrir o gerenciador <span>→</span></a><a class="button secondary" href="/docs/">Ler a documentação</a></div></section>
    </main>

    <footer class="site-footer"><span>ATACTE / PRIVATE VAULT</span><span><a href="/docs/">DOCS</a> · <a href="/releases/">RELEASES</a> · <a :href="managerUrl">ENTRAR</a></span></footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

const managerUrl = computed(() => import.meta.env.VITE_MANAGER_URL || '/manager/')

onMounted(() => {
  const nodes = document.querySelectorAll<HTMLElement>('.reveal')
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    nodes.forEach((node) => node.classList.add('is-visible'))
    return
  }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('is-visible')
    observer.unobserve(entry.target)
  }), { threshold: 0.12 })
  nodes.forEach((node) => observer.observe(node))
})
</script>
