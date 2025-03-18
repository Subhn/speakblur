export interface Message {
  id: string;
  text: string;
  username: string;
  timestamp: number;
  replyTo?: string;
  reactions?: { [key: string]: string[] };
  isPoll?: boolean;
  pollOptions?: PollOption[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface User {
  username: string;
  isOnline: boolean;
}