"use client";

import { MessageCircle } from "lucide-react";

interface Props { phoneNumber: string | null | undefined }

export default function WhatsAppButton({ phoneNumber }: Props) {
  if (!phoneNumber) return null;
  const phone = phoneNumber.replace(/\D/g, "");
  if (!phone) return null;
  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition hover:scale-105"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
