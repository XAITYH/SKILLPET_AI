export interface LearningState {
  chapterId: string;
  chapterTitle: string;
  chapterEmoji: string;
  chapterNumber: number;
  courseId: string;
  courseTitle: string;
  currentBlockIndex: number;
  gemsEarned: number;
  hearts: number;
  maxHearts: number;
  streakDays: number;
  completedBlocks: number[];
  incorrectBlocks: number[];
}

export interface UserProgress {
  gems: number;
  hearts: number;
  maxHearts: number;
  streakDays: number;
  lastStreakDate: string | null;
  completedChapters: string[];
}
