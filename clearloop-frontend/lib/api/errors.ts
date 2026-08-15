import axios from "axios";

// NestJS ValidationPipe returns `message` as string[] for field errors and a
// plain string everywhere else. Both shapes need to reach the user.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message) && message.length) return message.join(". ");
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}
