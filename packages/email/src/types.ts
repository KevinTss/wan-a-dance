export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: Record<string, string>;
}

export interface Mailer {
  send(email: OutgoingEmail): Promise<void>;
}
