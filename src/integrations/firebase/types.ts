export type Category = {
  id: string;
  name: string;
  created_at: string;
};

export type McqSet = {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type Mcq = {
  id: string;
  set_id: string;
  question: string;
  options: string[];
  answer: number;
  position: number;
  created_at: string;
};

export type DbError = { message: string };
