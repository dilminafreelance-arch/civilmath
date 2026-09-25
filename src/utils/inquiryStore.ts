import { ContactInquiry, InquiryStatus } from '../types/inquiry';

const LOCAL_STORAGE_KEY = 'civilmath_inquiries';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem('civilmath_admin_token');
  } catch {
    return null;
  }
}

export function getAllLocalInquiries(): ContactInquiry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read inquiries from localStorage:', err);
    return [];
  }
}

export function saveLocalInquiries(inquiries: ContactInquiry[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inquiries));
  } catch (err) {
    console.error('Failed to save inquiries to localStorage:', err);
  }
}

export function getUnreadInquiriesCount(): number {
  return getAllLocalInquiries().filter(inq => inq.status === 'unread').length;
}

export async function submitContactInquiry(data: {
  name: string;
  email: string;
  category: string;
  subject?: string;
  message: string;
}): Promise<{ success: boolean; error?: string; inquiryId?: string }> {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json.error || `Server responded with status ${res.status}`);
    }

    // Save locally as immediate backup
    const newInquiry: ContactInquiry = {
      id: json.inquiryId || `inq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: data.name.trim(),
      email: data.email.trim(),
      category: data.category,
      subject: data.subject?.trim(),
      message: data.message.trim(),
      status: 'unread',
      createdAt: new Date().toISOString(),
    };

    const existing = getAllLocalInquiries();
    saveLocalInquiries([newInquiry, ...existing.filter(i => i.id !== newInquiry.id)]);

    return { success: true, inquiryId: newInquiry.id };
  } catch (err: any) {
    console.warn('API submission failed, falling back to local queue:', err);
    // If offline or network issue, still save locally
    const fallbackInquiry: ContactInquiry = {
      id: `inq_offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: data.name.trim(),
      email: data.email.trim(),
      category: data.category,
      subject: data.subject?.trim(),
      message: data.message.trim(),
      status: 'unread',
      createdAt: new Date().toISOString(),
    };
    const existing = getAllLocalInquiries();
    saveLocalInquiries([fallbackInquiry, ...existing]);

    return { success: true, inquiryId: fallbackInquiry.id };
  }
}

export async function fetchAndSyncInquiries(): Promise<ContactInquiry[]> {
  const token = getStoredToken();
  if (!token) {
    return getAllLocalInquiries();
  }

  try {
    const res = await fetch('/api/inquiries', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const serverInquiries = await res.json();
      if (Array.isArray(serverInquiries)) {
        // Merge with local offline-created ones if any
        const local = getAllLocalInquiries();
        const serverIds = new Set(serverInquiries.map(i => i.id));
        const offlineOnly = local.filter(l => !serverIds.has(l.id) && l.id.startsWith('inq_offline_'));

        const combined = [...offlineOnly, ...serverInquiries];
        saveLocalInquiries(combined);
        return combined;
      }
    }
  } catch (err) {
    console.error('Failed to sync inquiries from server:', err);
  }

  return getAllLocalInquiries();
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<boolean> {
  // Update local first
  const current = getAllLocalInquiries();
  const updated = current.map(item => (item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item));
  saveLocalInquiries(updated);

  const token = getStoredToken();
  if (token) {
    try {
      await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return true;
    } catch (err) {
      console.error('Failed to update inquiry status on server:', err);
    }
  }

  return true;
}

export async function deleteInquiry(id: string): Promise<boolean> {
  // Remove local
  const current = getAllLocalInquiries();
  saveLocalInquiries(current.filter(item => item.id !== id));

  const token = getStoredToken();
  if (token) {
    try {
      await fetch(`/api/inquiries/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return true;
    } catch (err) {
      console.error('Failed to delete inquiry on server:', err);
    }
  }

  return true;
}
