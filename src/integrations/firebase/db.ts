import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import type { Category, DbError, Mcq, McqSet } from "./types";

const categoriesCol = collection(db, "categories");
const mcqSetsCol = collection(db, "mcq_sets");
const mcqsCol = collection(db, "mcqs");

function toDbError(err: unknown): DbError {
  return { message: err instanceof Error ? err.message : "Unknown error" };
}

function nowIso() {
  return new Date().toISOString();
}

function mapCategory(id: string, data: Record<string, unknown>): Category {
  return {
    id,
    name: data.name as string,
    created_at: data.created_at as string,
  };
}

function mapMcqSet(id: string, data: Record<string, unknown>): McqSet {
  return {
    id,
    category_id: data.category_id as string,
    title: data.title as string,
    description: (data.description as string | null) ?? null,
    created_at: data.created_at as string,
  };
}

function mapMcq(id: string, data: Record<string, unknown>): Mcq {
  return {
    id,
    set_id: data.set_id as string,
    question: data.question as string,
    options: Array.isArray(data.options) ? (data.options as string[]) : [],
    answer: data.answer as number,
    position: (data.position as number) ?? 0,
    created_at: data.created_at as string,
  };
}

export async function listCategories(): Promise<{ data: Category[] | null; error: DbError | null }> {
  try {
    const snap = await getDocs(query(categoriesCol, orderBy("created_at", "asc")));
    return { data: snap.docs.map((d) => mapCategory(d.id, d.data())), error: null };
  } catch (err) {
    return { data: null, error: toDbError(err) };
  }
}

export async function getCategoryById(
  id: string,
): Promise<{ data: Category | null; error: DbError | null }> {
  try {
    const snap = await getDoc(doc(categoriesCol, id));
    if (!snap.exists()) return { data: null, error: null };
    return { data: mapCategory(snap.id, snap.data()), error: null };
  } catch (err) {
    return { data: null, error: toDbError(err) };
  }
}

export async function createCategory(name: string): Promise<{ error: DbError | null }> {
  try {
    await addDoc(categoriesCol, { name, created_at: nowIso() });
    return { error: null };
  } catch (err) {
    return { error: toDbError(err) };
  }
}

export async function deleteCategory(id: string): Promise<{ error: DbError | null }> {
  try {
    const setsSnap = await getDocs(query(mcqSetsCol, where("category_id", "==", id)));
    const setIds = setsSnap.docs.map((d) => d.id);

    const mcqSnaps = setIds.length
      ? await Promise.all(
          chunk(setIds, 30).map((ids) => getDocs(query(mcqsCol, where("set_id", "in", ids)))),
        )
      : [];

    const batch = writeBatch(db);
    mcqSnaps.flatMap((s) => s.docs).forEach((d) => batch.delete(d.ref));
    setsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(categoriesCol, id));
    await batch.commit();
    return { error: null };
  } catch (err) {
    return { error: toDbError(err) };
  }
}

export async function listAllMcqSetRefs(): Promise<{
  data: Array<{ id: string; category_id: string }> | null;
  error: DbError | null;
}> {
  try {
    const snap = await getDocs(mcqSetsCol);
    return {
      data: snap.docs.map((d) => ({ id: d.id, category_id: d.data().category_id as string })),
      error: null,
    };
  } catch (err) {
    return { data: null, error: toDbError(err) };
  }
}

export async function listMcqSetsByCategory(
  categoryId: string,
): Promise<{ data: McqSet[] | null; error: DbError | null }> {
  try {
    const snap = await getDocs(query(mcqSetsCol, where("category_id", "==", categoryId)));
    const data = snap.docs
      .map((d) => mapMcqSet(d.id, d.data()))
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    return { data, error: null };
  } catch (err) {
    return { data: null, error: toDbError(err) };
  }
}

export async function getMcqSetById(
  id: string,
): Promise<{ data: McqSet | null; error: DbError | null }> {
  try {
    const snap = await getDoc(doc(mcqSetsCol, id));
    if (!snap.exists()) return { data: null, error: null };
    return { data: mapMcqSet(snap.id, snap.data()), error: null };
  } catch (err) {
    return { data: null, error: toDbError(err) };
  }
}

export async function createMcqSet(input: {
  category_id: string;
  title: string;
  description: string | null;
}): Promise<{ error: DbError | null }> {
  try {
    await addDoc(mcqSetsCol, { ...input, created_at: nowIso() });
    return { error: null };
  } catch (err) {
    return { error: toDbError(err) };
  }
}

export async function deleteMcqSet(id: string): Promise<{ error: DbError | null }> {
  try {
    const mcqsSnap = await getDocs(query(mcqsCol, where("set_id", "==", id)));
    const batch = writeBatch(db);
    mcqsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(mcqSetsCol, id));
    await batch.commit();
    return { error: null };
  } catch (err) {
    return { error: toDbError(err) };
  }
}

export async function listMcqsBySetId(
  setId: string,
): Promise<{ data: Mcq[] | null; error: DbError | null }> {
  try {
    const snap = await getDocs(query(mcqsCol, where("set_id", "==", setId)));
    const data = snap.docs
      .map((d) => mapMcq(d.id, d.data()))
      .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
    return { data, error: null };
  } catch (err) {
    return { data: null, error: toDbError(err) };
  }
}

export async function listMcqSetIdsForSets(
  setIds: string[],
): Promise<{ data: Array<{ set_id: string }> | null; error: DbError | null }> {
  if (setIds.length === 0) return { data: [], error: null };
  try {
    const snaps = await Promise.all(
      chunk(setIds, 30).map((ids) => getDocs(query(mcqsCol, where("set_id", "in", ids)))),
    );
    return {
      data: snaps.flatMap((s) => s.docs.map((d) => ({ set_id: d.data().set_id as string }))),
      error: null,
    };
  } catch (err) {
    return { data: null, error: toDbError(err) };
  }
}

export async function createMcq(input: {
  set_id: string;
  question: string;
  options: string[];
  answer: number;
  position: number;
}): Promise<{ error: DbError | null }> {
  try {
    await addDoc(mcqsCol, { ...input, created_at: nowIso() });
    return { error: null };
  } catch (err) {
    return { error: toDbError(err) };
  }
}

export async function createMcqs(
  rows: Array<{
    set_id: string;
    question: string;
    options: string[];
    answer: number;
    position: number;
  }>,
): Promise<{ error: DbError | null }> {
  if (rows.length === 0) return { error: null };
  try {
    const createdAt = nowIso();
    for (const group of chunk(rows, 500)) {
      const batch = writeBatch(db);
      group.forEach((row) => {
        const ref = doc(mcqsCol);
        batch.set(ref, { ...row, created_at: createdAt });
      });
      await batch.commit();
    }
    return { error: null };
  } catch (err) {
    return { error: toDbError(err) };
  }
}

export async function deleteMcq(id: string): Promise<{ error: DbError | null }> {
  try {
    await deleteDoc(doc(mcqsCol, id));
    return { error: null };
  } catch (err) {
    return { error: toDbError(err) };
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
