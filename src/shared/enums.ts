export enum UserPlan {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
}

export enum VoiceProfileStatus {
  DRAFT = 'draft',
  INTERVIEW_IN_PROGRESS = 'interview_in_progress',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

export enum InterviewSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export enum ExtractionStatus {
  PENDING = 'pending',
  DONE = 'done',
  FAILED = 'failed',
}

export enum ChapterStatus {
  OUTLINE = 'outline',
  DRAFT = 'draft',
  REVISED = 'revised',
  FINAL = 'final',
}

export enum ContentType {
  AI_GENERATED = 'ai_generated',
  HUMAN_EDITED = 'human_edited',
  AI_ASSISTED = 'ai_assisted',
}

export enum GenerationJobStatus {
  QUEUED = 'queued',
  STREAMING = 'streaming',
  DONE = 'done',
  FAILED = 'failed',
}

export enum ScribeMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}
