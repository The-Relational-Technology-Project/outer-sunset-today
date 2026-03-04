import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const siblingSites = [
  {
    question: "Live near 48th and Irving?",
    name: "Cozy Corner Neighbor Hub",
    domain: "cozycorner.place",
    url: "https://cozycorner.place",
    bgClass: "bg-card",
    pinColor: "bg-primary",
    rotate: "-rotate-1",
  },
  {
    question: "Exploring the neighborhood?",
    name: "Outer Sunset Field Guide",
    domain: "outersunset.place",
    url: "https://outersunset.place",
    bgClass: "bg-ocean-blue/10",
    pinColor: "bg-ocean-blue",
    rotate: "rotate-1",
  },
  {
    question: "Want to share things with neighbors?",
    name: "Community Supplies",
    domain: "communitysupplies.org",
    url: "https://communitysupplies.org",
    bgClass: "bg-dune-tan/15",
    pinColor: "bg-sunset-orange",
    rotate: "-rotate-[0.5deg]",
  },
  {
    question: "Looking for local community?",
    name: "Community Guide",
    domain: "outersunset.us",
    url: "https://outersunset.us",
    bgClass: "bg-sage-green/10",
    pinColor: "bg-sage-green",
    rotate: "rotate-[0.7deg]",
  },
];

const Pushpin = ({ color }: { color: string }) => (
  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
    <div className={`w-5 h-5 ${color} rounded-full shadow-md border-2 border-background`}>
      <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-background/40 rounded-full" />
    </div>
    <div className="w-0.5 h-2 bg-muted-foreground/30 mx-auto -mt-0.5" />
  </div>
);

const SiblingSitesBoard = () => (
  <section
    className="py-12 px-4 border-t border-border"
    style={{
      backgroundColor: "hsl(var(--muted))",
      backgroundImage:
        "radial-gradient(circle, hsl(var(--muted-foreground) / 0.08) 1px, transparent 1px)",
      backgroundSize: "16px 16px",
    }}
  >
    <div className="container mx-auto max-w-4xl">
      <h2 className="community-heading text-2xl sm:text-3xl text-foreground text-center mb-8">
        Neighborhood tools made by us, for us
      </h2>
      <div className="grid gap-8 sm:grid-cols-2">
        {siblingSites.map((site) => (
          <a
            key={site.domain}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative block rounded-lg border border-border p-6 pt-8 ${site.bgClass} ${site.rotate} transition-all duration-300 hover:rotate-0 hover:scale-[1.03] hover:-translate-y-1`}
            style={{ boxShadow: "var(--shadow-paper)" }}
          >
            <Pushpin color={site.pinColor} />
            <p className="text-sm text-muted-foreground mb-2 italic">
              {site.question}
            </p>
            <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              {site.name}
            </h3>
            <span className="inline-flex items-center gap-1 text-sm text-primary">
              {site.domain}
              <ExternalLink className="h-3 w-3" />
            </span>
          </a>
        ))}
      </div>
    </div>
  </section>
);

const CreditsFooter = () => (
  <section className="py-8 px-4 border-t border-border text-center">
    <div className="container mx-auto max-w-2xl space-y-3">
      <p className="text-muted-foreground">
        Made by neighbors, with neighbors, for neighbors 🧡
      </p>
      <p className="text-muted-foreground">
        Contact:{" "}
        <a
          href="mailto:hello@relationaltechproject.org"
          className="text-primary hover:underline"
        >
          hello@relationaltechproject.org
        </a>
      </p>
      <div className="flex flex-col items-center gap-2 text-sm">
        <a
          href="https://studio.relationaltechproject.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Remix this for your neighborhood!
        </a>
        <Link to="/privacy-terms" className="text-primary hover:underline">
          Privacy and Terms
        </Link>
      </div>
    </div>
  </section>
);

const SiteLinksFooter = () => (
  <section className="py-4 px-4 border-t border-border text-center">
    <a
      href="/llm.txt"
      className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
    >
      Are you a helpful bot?
    </a>
  </section>
);

export const SiteFooter = () => (
  <footer>
    <SiblingSitesBoard />
    <CreditsFooter />
    <SiteLinksFooter />
  </footer>
);
