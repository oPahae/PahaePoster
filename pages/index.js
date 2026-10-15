import Link from "next/link";
import { Database, Send, Server, Boxes, Share2, ArrowUpRight, Sparkles } from "lucide-react";

const modules = [
  {
    href: "/databaser",
    icon: Database,
    title: "Databaser",
    description: "Connecte-toi a MySQL ou PostgreSQL, explore les tables, execute du SQL et genere le MPD."
  },
  {
    href: "/poster",
    icon: Send,
    title: "API Poster",
    description: "Construis et envoie des requetes HTTP, inspecte la reponse et sa structure JSON."
  },
  {
    href: "/ssher",
    icon: Server,
    title: "SSHer",
    description: "Gere tes serveurs, ouvre un terminal interactif et navigue dans le systeme de fichiers."
  },
  {
    href: "/classer",
    icon: Boxes,
    title: "Classer",
    description: "Cree un diagramme de classes UML tres rapidement, a la main ou genere par l'IA."
  },
  {
    href: "/sharer",
    icon: Share2,
    title: "Sharer",
    description: "Partage fichiers et texte entre appareils du meme reseau local, sans application mobile."
  }
];

export default function HomePage() {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-grid-fade [background-size:22px_22px] opacity-[0.35] [mask-image:radial-gradient(ellipse_60%_100%_at_50%_0%,black,transparent)]" />

      <div className="relative mx-auto max-w-5xl px-6 py-14 sm:px-8">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            <Sparkles size={11} /> Toolkit unifie
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-base-100">
            Bienvenue dans <span className="bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-transparent">PahaePoster</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-base-400">
            Cinq outils de developpeur reunis dans une seule interface : base de donnees, requetes API, gestion SSH,
            diagrammes de classes et partage reseau local.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                style={{ animationDelay: `${index * 60}ms` }}
                className="card-hover group relative flex animate-slide-up flex-col justify-between overflow-hidden rounded-xl border border-base-800 bg-base-900 p-5 shadow-card hover:border-accent/40 hover:shadow-glow"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/0 blur-2xl transition-colors duration-300 group-hover:bg-accent/10" />
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 text-accent ring-1 ring-accent/20 transition-transform duration-200 group-hover:scale-105">
                    <Icon size={19} />
                  </div>
                  <h2 className="mt-4 text-sm font-semibold text-base-100">{module.title}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-base-400">{module.description}</p>
                </div>
                <div className="relative mt-6 flex items-center gap-1 text-xs font-medium text-base-500 group-hover:text-accent">
                  Ouvrir
                  <ArrowUpRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
