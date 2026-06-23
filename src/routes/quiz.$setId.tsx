import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getMcqSetById, listMcqsBySetId } from "@/integrations/firebase/db";
import { SiteShell } from "@/components/SiteShell";
import { ArrowLeft, Check, RotateCcw, Trophy } from "lucide-react";

export const Route = createFileRoute("/quiz/$setId")({
  component: QuizPage,
});

type Mcq = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  position: number;
};

function QuizPage() {
  const { setId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["quiz", setId],
    queryFn: async () => {
      const [{ data: set }, { data: mcqs }] = await Promise.all([
        getMcqSetById(setId),
        listMcqsBySetId(setId),
      ]);
      const cleaned: Mcq[] = (mcqs ?? []).map((m) => ({
        id: m.id,
        question: m.question,
        options: m.options,
        answer: m.answer,
        position: m.position,
      }));
      return { set, mcqs: cleaned };
    },
  });

  const total = data?.mcqs.length ?? 0;
  const [choices, setChoices] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useMemo(() => {
    if (data?.mcqs && choices.length !== data.mcqs.length) {
      setChoices(new Array(data.mcqs.length).fill(null));
      setSubmitted(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.mcqs.length]);

  if (isLoading) {
    return (
      <SiteShell>
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="h-64 rounded-2xl bg-muted animate-pulse" />
        </div>
      </SiteShell>
    );
  }

  if (!data?.set) {
    return (
      <SiteShell>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Set not found</h1>
          <Link to="/" className="text-primary mt-4 inline-block">Go home</Link>
        </div>
      </SiteShell>
    );
  }

  if (total === 0) {
    return (
      <SiteShell>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">{data.set.title}</h1>
          <p className="text-muted-foreground mt-2">No questions in this set yet.</p>
          <Link
            to="/category/$categoryId"
            params={{ categoryId: data.set.category_id }}
            className="text-primary mt-6 inline-block"
          >
            ← Back to category
          </Link>
        </div>
      </SiteShell>
    );
  }

  const score = submitted
    ? data.mcqs.reduce((s, q, i) => s + (choices[i] === q.answer ? 1 : 0), 0)
    : 0;
  const pct = submitted ? Math.round((score / total) * 100) : 0;
  const answeredCount = choices.filter((c) => c !== null).length;
  const progress = (answeredCount / total) * 100;

  return (
    <SiteShell>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <Link
          to="/category/$categoryId"
          params={{ categoryId: data.set.category_id }}
          className="inline-flex items-center gap-1.5 text-base sm:text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="rounded-3xl bg-card-grad border border-border shadow-elevated p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold">{data.set.title}</h1>
              {data.set.description && (
                <p className="text-muted-foreground mt-1 text-base sm:text-sm">{data.set.description}</p>
              )}
            </div>
            <div className="inline-flex items-center gap-2 text-base sm:text-sm font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-full self-start">
              {total} questions
            </div>
          </div>

          {!submitted && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm font-semibold mb-1.5">
                <span className="text-muted-foreground">Answered: {answeredCount} / {total}</span>
                <span className="text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-hero transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Result banner */}
        {submitted && (
          <div className="mt-6 rounded-3xl bg-hero text-primary-foreground p-6 sm:p-8 text-center shadow-elevated">
            <Trophy className="h-10 w-10 mx-auto mb-2 opacity-90" />
            <div className="text-4xl sm:text-5xl font-extrabold">
              {score}<span className="opacity-70 text-2xl"> / {total}</span>
            </div>
            <div className="mt-1 text-base sm:text-sm opacity-90">{pct}% — Practice complete!</div>
            <div className="mt-5 flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => {
                  setChoices(new Array(total).fill(null));
                  setSubmitted(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-background text-foreground text-base sm:text-sm font-semibold hover:bg-secondary transition"
              >
                <RotateCcw className="h-4 w-4" /> Try again
              </button>
              <Link
                to="/category/$categoryId"
                params={{ categoryId: data.set!.category_id }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-background/20 ring-1 ring-white/30 text-base sm:text-sm font-semibold hover:bg-background/30 transition"
              >
                Other sets
              </Link>
            </div>
          </div>
        )}

        {/* Questions list */}
        <div className="mt-6 space-y-4">
          {data.mcqs.map((q, i) => {
            const userChoice = choices[i];
            return (
              <div
                key={q.id}
                className={`rounded-2xl bg-card border border-border shadow-soft p-5 sm:p-6 ${
                  submitted
                    ? userChoice === q.answer
                      ? "border-l-4 border-l-success"
                      : "border-l-4 border-l-danger"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="h-9 w-9 sm:h-8 sm:w-8 shrink-0 rounded-lg bg-primary/10 text-primary font-bold text-base sm:text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-bold leading-snug flex-1">{q.question}</h3>
                </div>

                <div className="mt-4 grid gap-2 sm:gap-2.5">
                  {q.options.map((opt, oi) => {
                    const active = userChoice === oi;
                    const isCorrect = submitted && oi === q.answer;
                    const isWrongPick = submitted && active && oi !== q.answer;

                    let cls =
                      "border-border bg-background hover:border-primary/60 hover:bg-primary/5";
                    if (submitted) {
                      if (isCorrect)
                        cls = "border-success bg-success/10 text-success";
                      else if (isWrongPick)
                        cls = "border-danger bg-danger/10 text-danger";
                      else cls = "border-border bg-background opacity-80";
                    } else if (active) {
                      cls =
                        "border-primary bg-primary text-primary-foreground shadow-glow";
                    }

                    return (
                      <button
                        key={oi}
                        disabled={submitted}
                        onClick={() => {
                          const next = [...choices];
                          next[i] = oi;
                          setChoices(next);
                        }}
                        className={`text-left flex items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 sm:px-4 sm:py-3 transition ${cls} ${
                          submitted ? "cursor-default" : ""
                        }`}
                      >
                        <span
                          className={`h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-md flex items-center justify-center font-bold text-sm sm:text-xs ${
                            active && !submitted
                              ? "bg-primary-foreground text-primary"
                              : isCorrect
                              ? "bg-success text-white"
                              : isWrongPick
                              ? "bg-danger text-white"
                              : "bg-secondary text-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="text-base font-medium flex-1">{opt}</span>
                        {active && !submitted && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>

                {submitted && userChoice !== q.answer && (
                  <div className="mt-3 text-sm rounded-lg bg-success/10 text-success px-3 py-2">
                    <span className="font-semibold">Correct answer:</span>{" "}
                    {q.options[q.answer]}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit */}
        {!submitted && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                setSubmitted(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-8 py-3 rounded-xl bg-hero text-primary-foreground text-lg font-bold shadow-glow hover:opacity-95 transition"
            >
              Submit & See Results
            </button>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
