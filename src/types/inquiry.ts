export type InquiryCategory =
  | 'General Question'
  | 'Calculator Issue'
  | 'Article Feedback'
  | 'Technical Problem'
  | 'Business / Partnership'
  | 'Content Correction'
  | string;

export type InquiryStatus = 'unread' | 'read' | 'replied' | 'archived';

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  category: string;
  subject?: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}
