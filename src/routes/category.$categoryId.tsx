import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCategoryById, listMcqSetIdsForSets, listMcqSetsByCategory } from "@/integrations/firebase/db";
import { SiteShell } from "@/components/SiteShell";
import { ArrowLeft, ChevronRight, FileQuestion } from "lucide-react";

export const Route = createFileRoute("/category/$categoryId")({
  component: CategoryPage,
});

function CategoryPage() {
  const { categoryId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: async () => {
      const [{ data: cat }, { data: sets }] = await Promise.all([
        getCategoryById(categoryId),
        listMcqSetsByCategory(categoryId),
      ]);
      let counts = new Map<string, number>();
      if (sets && sets.length) {
        const { data: mcqs } = await listMcqSetIdsForSets(sets.map((s) => s.id));
        (mcqs ?? []).forEach((m) => counts.set(m.set_id, (counts.get(m.set_id) ?? 0) + 1));
      }
      return { cat, sets: sets ?? [], counts };
    },
  });

  return (
    <SiteShell>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> All categories
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold">
          {data?.cat?.name ?? <span className="text-muted-foreground">Loading…</span>}
        </h1>
        <p className="text-muted-foreground mt-1">Choose an MCQ set to start practicing.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
              ))
            : data?.sets.length === 0 ? (
              <div className="sm:col-span-2 rounded-2xl border border-dashed p-10 text-center bg-card-grad">
                <FileQuestion className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-bold">No sets yet in this category</h3>
                <p className="text-sm text-muted-foreground">Ask the admin to add a set.</p>
              </div>
            ) : (
              data!.sets.map((s) => (
                <Link
                  key={s.id}
                  to="/quiz/$setId"
                  params={{ setId: s.id }}
                  className="group rounded-2xl bg-card-grad border border-border p-5 shadow-soft hover:shadow-elevated transition flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate">{s.title}</h3>
                    {s.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{s.description}</p>
                    )}
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {data!.counts.get(s.id) ?? 0} questions
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition shrink-0" />
                </Link>
              ))
            )}
        </div>
      </section>
    </SiteShell>
  );
}
