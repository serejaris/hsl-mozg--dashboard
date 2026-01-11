export const COURSE_NAMES: Record<number, string> = {
  1: 'Вайб кодинг'
};

export const STREAM_NAMES: Record<string, string> = {
  '3rd_stream': '3-й поток',
  '4th_stream': '4-й поток',
  '5th_stream': '5-й поток',
  '6th_stream': '6-й поток',
  '7th_stream': '7-й поток',
  '8th_stream': '8-й поток',
  'mentoring': 'Менторинг'
};

// Current active stream config (for "viewed" status detection)
export const CURRENT_STREAM = {
  stream: '8th_stream',
  courseId: 1,
  startDate: '2025-12-18'  // Date when 8th stream campaign started
};

export function getCourseName(courseId: number) {
  return COURSE_NAMES[courseId] || `Course ${courseId}`;
}

export function getStreamName(stream?: string | null) {
  if (!stream) return stream ?? '';
  return STREAM_NAMES[stream] || stream;
}

export const BookingStatus = {
  CREATED: 0,
  PENDING: 1,
  CONFIRMED: 2,
  CANCELLED: -1,
} as const;

export type BookingStatusValue = typeof BookingStatus[keyof typeof BookingStatus];

const BOOKING_STATUS_META: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  [BookingStatus.CONFIRMED]: {
    label: 'Подтверждено',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-200'
  },
  [BookingStatus.PENDING]: {
    label: 'В ожидании',
    variant: 'secondary',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
  },
  [BookingStatus.CREATED]: {
    label: 'Новая заявка',
    variant: 'outline',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  [BookingStatus.CANCELLED]: {
    label: 'Отменено',
    variant: 'destructive'
  }
};

export function getBookingStatusMeta(status: BookingStatusValue | null) {
  const meta = status !== null ? BOOKING_STATUS_META[status] : undefined;
  return meta ?? { label: 'Неизвестно', variant: 'outline' as const };
}

export function getBookingStatusLabel(status: BookingStatusValue | null) {
  return getBookingStatusMeta(status).label;
}
