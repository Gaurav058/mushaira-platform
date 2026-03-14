import { RegistrationStatus } from '@/constants/types';
import { Colors } from '@/constants/theme';

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} • ${formatTime(date)}`;
}

export function isRegistrationOpen(start: string, end: string): boolean {
  const now = Date.now();
  return now >= new Date(start).getTime() && now <= new Date(end).getTime();
}

export function registrationStatusLabel(status: RegistrationStatus): string {
  const labels: Record<RegistrationStatus, string> = {
    [RegistrationStatus.PENDING]: 'Pending Approval',
    [RegistrationStatus.APPROVED]: 'Approved',
    [RegistrationStatus.REJECTED]: 'Rejected',
    [RegistrationStatus.WAITLIST]: 'On Waitlist',
    [RegistrationStatus.CHECKED_IN]: 'Checked In',
  };
  return labels[status] ?? status;
}

export function registrationStatusColor(status: RegistrationStatus): string {
  return Colors.registration[status] ?? Colors.text.secondary;
}

export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    const msg = axiosErr.response?.data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
  }
  return 'Something went wrong. Please try again.';
}
