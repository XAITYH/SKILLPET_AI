export type BlockType =
  | "theory"
  | "code"
  | "fill-blank"
  | "multiple-choice"
  | "true-false"
  | "yes-no"
  | "matching";

export type Difficulty = "easy" | "medium" | "hard";

export interface ChapterContentBlock {
  id: number;
  documentId: string;
  type: BlockType;
  content: TheoryContent | CodeContent | FillBlankContent | MCQContent | TrueFalseContent | YesNoContent | MatchingContent;
  difficulty: Difficulty;
  hint?: string;
  order: number;
}

export interface TheoryContent {
  title: string;
  body: string;
}

export interface CodeContent {
  title: string;
  explanation: string;
  code: string;
  task: string;
  expectedAnswer: string;
}

export interface FillBlankContent {
  sentence: string;
  options: string[];
  correctIndex: number;
}

export interface MCQContent {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TrueFalseContent {
  statement: string;
  correct: boolean;
}

export interface YesNoContent {
  question: string;
  correct: boolean;
}

export interface MatchingContent {
  question: string;
  options: string[];
  correctIndex: number;
}
