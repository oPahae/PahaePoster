import Link from "next/link";
import { useRouter } from "next/router";
import { Database, Send, Server, Boxes, Share2, Settings, Sun, Moon, Sparkles } from "lucide-react";
import { classNames } from "../../lib/utils";
import { useTheme } from "./ThemeContext";

const navItems = [
  { href: "/databaser", label: "Databaser", icon: Database },
  { href: "/poster", label: "Poster", icon: Send },
  { href: "/ssher", label: "SSHer", icon: Server },
  { href: "/classer", label: "Classer", icon: Boxes },
  { href: "/sharer", label: "Sharer", icon: Share2 }
];

export default function Sidebar({ hideOnMobile }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      className={classNames(
        "h-screen w-56 shrink-0 flex-col border-r border-base-800 bg-base-900/95 backdrop-blur-sm",
        hideOnMobile ? "hidden md:flex" : "flex"
      )}
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-strong text-base-950 shadow-glow-sm">
          <span className="font-mono text-sm font-bold">P</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-base-100 leading-none">PahaePoster</p>
          <p className="mt-1.5 flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wider text-base-500 leading-none">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-glow-sm" />
            Toolkit developpeur
          </p>
        </div>
      </div>

      <nav className="mt-3 flex flex-1 flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = router.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={classNames(
                "group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-sm font-medium",
                active ? "bg-accent/10 text-accent" : "text-base-400 hover:bg-base-800/70 hover:text-base-200"
              )}
            >
              <span
                className={classNames(
                  "absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-accent transition-all duration-200",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-30"
                )}
              />
              <Icon
                size={16}
                className={classNames("transition-transform duration-200", active ? "" : "group-hover:translate-x-0.5")}
              />
              {item.label}
              {active && <Sparkles size={11} className="ml-auto text-accent/70" />}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-base-800 px-3 py-4">
        <button
          onClick={toggleTheme}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-base-400 hover:bg-base-800/70 hover:text-base-200"
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            <Sun
              size={16}
              className={classNames(
                "absolute transition-all duration-300",
                theme === "dark" ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
              )}
            />
            <Moon
              size={16}
              className={classNames(
                "absolute transition-all duration-300",
                theme === "light" ? "rotate-0 opacity-100" : "rotate-90 opacity-0"
              )}
            />
          </span>
          <span>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
        </button>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-base-500">
          <Settings size={16} />
          <span>Parametres</span>
        </div>
      </div>
    </aside>
  );
}
