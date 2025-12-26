export type BookingStatus = -1 | 0 | 1 | 2 | null;
export type BookingDecisionStatus = Exclude<BookingStatus, null>;

export interface DashboardStats {
  totalUsers: number;
  activeBookings: number;
  confirmedPayments: number;
  freeLessonRegistrations: number;
}

export interface CourseStats {
  courseId: number;
  courseName: string;
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}

export interface CourseStreamStats {
  courseId: number;
  courseName: string;
  courseStream: string;      // Formatted: "3-й поток"
  courseStreamRaw: string;   // Raw: "3rd_stream"
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}

export interface EventStats {
  eventType: string;
  count: number;
}

export interface FreeLessonRegistration {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  email: string;
  registered_at: string;
  notification_sent: boolean;
  lesson_type: string;
  lesson_date: string;
}

export interface DailyStats {
  date: string;
  newUsers: number;
  bookings: number;
  events: number;
}

export interface UserGrowthData {
  date: string;
  totalUsers: number;
  newUsers: number;
}

export interface LessonConversionStats {
  lesson_type: string;
  registrations: number;
  attendances: number;
  conversion_rate: number;
}

export interface RecentEvent {
  id: number;
  user_id: number;
  username: string | null;
  first_name: string | null;
  event_type: string;
  created_at: string;
  details: any;
}

export interface TelegramUser {
  user_id: number;
  username: string | null;
  first_name: string | null;
  course_stream?: string | null;
}

export interface MessageHistory {
  id: number;
  message_text: string;
  sent_at: string;
  total_recipients: number;
  successful_deliveries: number;
  recipient_type: 'individual' | 'group';
  recipient_group: string | null;
}

export interface MessageRecipient {
  id: number;
  message_id: number;
  user_id: number;
  username: string | null;
  delivery_status: string;
}

export interface AuditLogEntry {
  id: number;
  action: string;
  user_id: number | null;
  user_role: string | null;
  entity_type: string | null;
  entity_id: number | null;
  status: 'success' | 'failure';
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface UserDetailInfo {
  user_id: number;
  username: string | null;
  first_name: string | null;
  last_activity?: string;
  total_bookings: number;
  total_events: number;
  total_free_lessons: number;
  latest_stream: string | null;
  latest_payment_status: BookingStatus;
}

export interface UserBookingInfo {
  id: number;
  user_id: number;
  course_id: number;
  course_stream: string | null;
  confirmed: BookingDecisionStatus;
  created_at: string;
  referral_code: string | null;
  discount_percent: number | null;
}

export interface UserEventInfo {
  id: number;
  event_type: string;
  created_at: string;
  details: any;
}

export interface UserFreeLessonInfo {
  id: number;
  user_id: number;
  email: string | null;
  registered_at: string;
  notification_sent: boolean;
  lesson_type: string | null;
  lesson_date: string | null;
}

export interface BookingRecord {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  course_id: number;
  course_stream: string;
  confirmed: BookingDecisionStatus;
  created_at: string;
  referral_code: string;
  discount_percent: number;
}

export interface StreamStudent {
  user_id: number;
  username: string | null;
  first_name: string | null;
  confirmed: number | null;  // null = viewed only, no booking
  created_at: string;
  last_activity: string | null;
  events_count: number;
  source: 'booking' | 'viewed';
}
