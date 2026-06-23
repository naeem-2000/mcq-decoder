import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCategory,
  createMcq,
  createMcqs,
  createMcqSet,
  deleteCategory,
  deleteMcq,
  deleteMcqSet,
  listCategories,
  listMcqsBySetId,
  listMcqSetsByCategory,
} from "@/integrations/firebase/db";
import { SiteShell } from "@/components/SiteShell";
import { ADMIN_PASSWORD, isAdmin, setAdmin } from "@/lib/admin-auth";
import {
  ArrowLeft, ChevronRight, Folder, FolderPlus, ListPlus, LogOut, Lock, Plus, Trash2, FileText, Eye, EyeOff,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthedState] = useState(false);
  useEffect(() => setAuthedState(isAdmin()), []);

  if (!authed) return <LoginScreen onSuccess={() => setAuthedState(true)} />;
  return <AdminDashboard onLogout={() => { setAdmin(false); setAuthedState(false); }} />;
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setAdmin(true);
      toast.success("Welcome, admin");
      onSuccess();
    } else {
      setErr("Incorrect password");
    }
  };

  return (
    <SiteShell>
      <section className="max-w-md mx-auto px-4 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="rounded-3xl bg-card-grad border border-border shadow-elevated p-8">
          <div className="h-12 w-12 rounded-2xl bg-hero text-primary-foreground shadow-glow flex items-center justify-center mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter the admin password to continue.</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <div className="relative">
              <input
                autoFocus
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setErr(""); }}
                placeholder="Password"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-11 outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                aria-label="toggle password"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {err && <div className="text-sm text-danger">{err}</div>}
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-xl bg-hero text-primary-foreground font-bold shadow-glow hover:opacity-95 transition"
            >
              Sign in
            </button>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}

type Category = { id: string; name: string };
type Set_ = { id: string; title: string; description: string | null; category_id: string };

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const qc = useQueryClient();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => {
      const { data } = await listCategories();
      return (data ?? []) as Category[];
    },
  });

  const { data: sets } = useQuery({
    queryKey: ["admin-sets", selectedCat],
    enabled: !!selectedCat,
    queryFn: async () => {
      const { data } = await listMcqSetsByCategory(selectedCat!);
      return (data ?? []) as Set_[];
    },
  });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-cats"] });
    qc.invalidateQueries({ queryKey: ["admin-sets"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["category"] });
  };

  return (
    <SiteShell>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage categories, sets, and MCQs.</p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Categories */}
          <div className="rounded-2xl bg-card border border-border shadow-soft p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold flex items-center gap-2"><Folder className="h-4 w-4 text-primary" /> Categories</h2>
            </div>
            <CreateCategory onCreated={refreshAll} />
            <div className="mt-3 space-y-1.5 max-h-[60vh] overflow-auto">
              {(categories ?? []).map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer border ${
                    selectedCat === c.id ? "bg-primary/10 border-primary/30" : "bg-background border-transparent hover:border-border"
                  }`}
                  onClick={() => { setSelectedCat(c.id); setSelectedSet(null); }}
                >
                  <span className="font-medium truncate">{c.name}</span>
                  <div className="flex items-center gap-1">
                    <DeleteBtn
                      label="category"
                      onConfirm={async () => {
                        const { error } = await deleteCategory(c.id);
                        if (error) return toast.error(error.message);
                        toast.success("Category deleted");
                        if (selectedCat === c.id) { setSelectedCat(null); setSelectedSet(null); }
                        refreshAll();
                      }}
                    />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
              {categories?.length === 0 && <div className="text-sm text-muted-foreground">No categories yet.</div>}
            </div>
          </div>

          {/* Sets */}
          <div className="rounded-2xl bg-card border border-border shadow-soft p-4">
            <h2 className="font-bold flex items-center gap-2 mb-3"><FileText className="h-4 w-4 text-primary" /> Sets</h2>
            {!selectedCat ? (
              <div className="text-sm text-muted-foreground">Select a category to view its sets.</div>
            ) : (
              <>
                <CreateSet categoryId={selectedCat} onCreated={refreshAll} />
                <div className="mt-3 space-y-1.5 max-h-[60vh] overflow-auto">
                  {(sets ?? []).map((s) => (
                    <div
                      key={s.id}
                      className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer border ${
                        selectedSet === s.id ? "bg-primary/10 border-primary/30" : "bg-background border-transparent hover:border-border"
                      }`}
                      onClick={() => setSelectedSet(s.id)}
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{s.title}</div>
                        {s.description && <div className="text-xs text-muted-foreground truncate">{s.description}</div>}
                      </div>
                      <DeleteBtn
                        label="set"
                        onConfirm={async () => {
                          const { error } = await deleteMcqSet(s.id);
                          if (error) return toast.error(error.message);
                          toast.success("Set deleted");
                          if (selectedSet === s.id) setSelectedSet(null);
                          refreshAll();
                        }}
                      />
                    </div>
                  ))}
                  {sets?.length === 0 && <div className="text-sm text-muted-foreground">No sets yet.</div>}
                </div>
              </>
            )}
          </div>

          {/* MCQs */}
          <div className="rounded-2xl bg-card border border-border shadow-soft p-4 lg:col-span-1">
            <h2 className="font-bold flex items-center gap-2 mb-3"><ListPlus className="h-4 w-4 text-primary" /> MCQs</h2>
            {!selectedSet ? (
              <div className="text-sm text-muted-foreground">Select a set to manage its questions.</div>
            ) : (
              <McqManager setId={selectedSet} />
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function CreateCategory({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await createCategory(name.trim());
    if (error) return toast.error(error.message);
    toast.success("Category created");
    setName("");
    onCreated();
  };
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Programming"
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <button type="submit" className="px-3 py-2 rounded-lg bg-hero text-primary-foreground font-semibold text-sm shadow-glow inline-flex items-center gap-1">
        <FolderPlus className="h-4 w-4" /> Add
      </button>
    </form>
  );
}

function CreateSet({ categoryId, onCreated }: { categoryId: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const { error } = await createMcqSet({
      category_id: categoryId, title: title.trim(), description: desc.trim() || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Set created");
    setTitle(""); setDesc("");
    onCreated();
  };
  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Set title (e.g. Chapter 6 - Database)"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description (optional)"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <button type="submit" className="w-full px-3 py-2 rounded-lg bg-hero text-primary-foreground font-semibold text-sm shadow-glow inline-flex items-center justify-center gap-1">
        <Plus className="h-4 w-4" /> Add set
      </button>
    </form>
  );
}

function McqManager({ setId }: { setId: string }) {
  const qc = useQueryClient();
  const { data: mcqs, refetch } = useQuery({
    queryKey: ["admin-mcqs", setId],
    queryFn: async () => {
      const { data } = await listMcqsBySetId(setId);
      return (data ?? []) as Array<{ id: string; question: string; options: any; answer: number; position: number }>;
    },
  });

  const [mode, setMode] = useState<"single" | "json">("single");
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [ans, setAns] = useState(0);
  const [json, setJson] = useState('[\n  { "q": "Question?", "o": ["A","B","C","D"], "a": 0 }\n]');

  const addSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim() || opts.some((o) => !o.trim())) return toast.error("Fill question + 4 options");
    const position = (mcqs?.length ?? 0);
    const { error } = await createMcq({
      set_id: setId, question: q.trim(), options: opts.map((o) => o.trim()), answer: ans, position,
    });
    if (error) return toast.error(error.message);
    toast.success("Question added");
    setQ(""); setOpts(["", "", "", ""]); setAns(0);
    refetch(); qc.invalidateQueries({ queryKey: ["quiz", setId] });
  };

  const importJson = async () => {
    try {
      const arr = JSON.parse(json);
      if (!Array.isArray(arr)) throw new Error("JSON must be an array");
      const baseIdx = mcqs?.length ?? 0;
      const rows = arr.map((it: any, i: number) => {
        const question = it.q ?? it.question;
        const options = it.o ?? it.options;
        const answer = it.a ?? it.answer;
        if (!question || !Array.isArray(options) || typeof answer !== "number") {
          throw new Error(`Invalid item at index ${i}`);
        }
        return { set_id: setId, question, options, answer, position: baseIdx + i };
      });
      const { error } = await createMcqs(rows);
      if (error) throw error;
      toast.success(`Imported ${rows.length} questions`);
      refetch(); qc.invalidateQueries({ queryKey: ["quiz", setId] });
    } catch (e: any) {
      toast.error(e.message ?? "Invalid JSON");
    }
  };

  return (
    <div>
      <div className="flex gap-1 mb-3 p-1 rounded-lg bg-secondary">
        <button
          onClick={() => setMode("single")}
          className={`flex-1 text-xs font-semibold py-1.5 rounded ${mode === "single" ? "bg-background shadow" : "text-muted-foreground"}`}
        >
          Single
        </button>
        <button
          onClick={() => setMode("json")}
          className={`flex-1 text-xs font-semibold py-1.5 rounded ${mode === "json" ? "bg-background shadow" : "text-muted-foreground"}`}
        >
          Bulk JSON
        </button>
      </div>

      {mode === "single" ? (
        <form onSubmit={addSingle} className="space-y-2">
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Question"
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {opts.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAns(i)}
                className={`h-7 w-7 rounded-full text-xs font-bold ${ans === i ? "bg-success text-success-foreground" : "bg-secondary text-muted-foreground"}`}
                title={ans === i ? "Correct answer" : "Mark correct"}
              >
                {String.fromCharCode(65 + i)}
              </button>
              <input
                value={o}
                onChange={(e) => setOpts((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
          <button type="submit" className="w-full px-3 py-2 rounded-lg bg-hero text-primary-foreground font-semibold text-sm shadow-glow inline-flex items-center justify-center gap-1">
            <Plus className="h-4 w-4" /> Add question
          </button>
        </form>
      ) : (
        <div className="space-y-2">
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-[11px] text-muted-foreground">
            Format: <code>{'[{ "q": "...", "o": ["A","B","C","D"], "a": 0 }]'}</code> — <code>a</code> is the correct option index (0-based).
          </p>
          <button
            onClick={importJson}
            className="w-full px-3 py-2 rounded-lg bg-accent-grad text-accent-foreground font-semibold text-sm shadow-sog inline-flex items-center justify-center gap-1"
          >
            <Plus className="h-4 w-4" /> Import JSON
          </button>
        </div>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <div className="text-xs font-semibold text-muted-foreground mb-2">{mcqs?.length ?? 0} questions in set</div>
        <div className="space-y-1.5 max-h-[40vh] overflow-auto">
          {(mcqs ?? []).map((m, i) => (
            <div key={m.id} className="flex items-start gap-2 p-2 rounded-lg bg-background border border-border">
              <span className="text-[10px] font-bold text-primary mt-0.5 shrink-0">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{m.question}</div>
                <div className="text-[11px] text-success mt-0.5 truncate">
                  ✓ {Array.isArray(m.options) ? m.options[m.answer] : ""}
                </div>
              </div>
              <DeleteBtn
                label="question"
                onConfirm={async () => {
                  const { error } = await deleteMcq(m.id);
                  if (error) return toast.error(error.message);
                  toast.success("Deleted");
                  refetch(); qc.invalidateQueries({ queryKey: ["quiz", setId] });
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeleteBtn({ onConfirm, label }: { onConfirm: () => unknown | Promise<unknown>; label: string }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (confirm(`Delete this ${label}? This cannot be undone.`)) onConfirm();
      }}
      className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition"
      title={`Delete ${label}`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
