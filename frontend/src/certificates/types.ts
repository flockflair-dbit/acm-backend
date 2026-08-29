export interface OverlayConfig {
  xPercent: number;
  yPercent: number;
  fontSizePercent: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
}

export interface Attendee {
  acmId: string;
  name: string;
}

export interface CertificateEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  templateUrl: string | null;
  overlay: OverlayConfig;
  attendeeCount: number;
  createdAt: string;
  attendees?: Attendee[];
}

export interface GenerateSuccess {
  eligible: true;
  acmId: string;
  name: string;
  event: CertificateEvent;
}
