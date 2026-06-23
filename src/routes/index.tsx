import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listAllMcqSetRefs, listCategories } from "@/integrations/firebase/db";
import { SiteShell } from "@/components/SiteShell";
import { CircularLoader } from "@/components/ui/circular-loader";
import { BookOpen, ChevronRight, Layers, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MCQ Decoder — IT Job Prep MCQ Categories" },
      { name: "description", content: "Choose a category and start practicing MCQs." },
    ],
  }),
  component: HomePage,
});

type Category = { id: string; name: string };

function HomePage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const [{ data: cats }, { data: sets }] = await Promise.all([
        listCategories(),
        listAllMcqSetRefs(),
      ]);
      const counts = new Map<string, number>();
      (sets ?? []).forEach((s) => counts.set(s.category_id, (counts.get(s.category_id) ?? 0) + 1));
      return ((cats ?? []) as Category[]).map((c) => ({ ...c, setCount: counts.get(c.id) ?? 0 }));
    },
  });

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-20 sm:pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground border border-accent/20 text-[11px] sm:text-xs font-semibold mb-4 sm:mb-5">
            <Sparkles className="h-3.5 w-3.5" /> IT Job Preparation
          </div>
          <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
            <span className="text-gradient">Crack Your Next</span>
            <br />
            <span className="text-foreground">IT Job Interview.</span>
          </h1>
          <p className="mt-4 sm:mt-5 max-w-2xl text-sm sm:text-lg text-muted-foreground">
            Practice curated MCQs across Programming, OOP, Databases, and more.
            Pick a category, choose a set, and review your answers instantly.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Categories
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <CircularLoader size="lg" />
          </div>
        ) : !categories || categories.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                to="/category/$categoryId"
                params={{ categoryId: c.id }}
                className="group relative overflow-hidden rounded-2xl bg-card-grad border border-border p-5 sm:p-6 shadow-soft hover:shadow-elevated transition-all hover:-translate-y-0.5"
              >
                <div
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 group-hover:opacity-40 transition"
                  style={{
                    background: `conic-gradient(from ${i * 60}deg, var(--primary), var(--accent), var(--primary-glow))`,
                  }}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-hero text-primary-foreground flex items-center justify-center shadow-glow mb-4">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold leading-tight">{c.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {c.setCount} {c.setCount === 1 ? "set" : "sets"} available
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center bg-card-grad">
      <div className="h-12 w-12 mx-auto rounded-xl bg-hero text-primary-foreground flex items-center justify-center mb-4 shadow-glow">
        <Layers className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold">No categories yet</h3>
      <p className="text-sm text-muted-foreground mt-1">
        The admin can create categories and MCQ sets from the admin panel.
      </p>
    </div>
  );
}
