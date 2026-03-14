export const NotificationEvents = {
  REGISTRATION_CREATED: 'registration.created',
  REGISTRATION_APPROVED: 'registration.approved',
  REGISTRATION_REJECTED: 'registration.rejected',
  EVENT_LIVE: 'event.live',
  EVENT_COMPLETED: 'event.completed',
} as const;

export interface RegistrationEventPayload {
  registrationId: string;
  eventId: string;
  notes?: string;
}

export interface EventStatusPayload {
  eventId: string;
}
