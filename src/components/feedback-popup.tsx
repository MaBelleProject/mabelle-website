"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, MessageCircleHeart } from "lucide-react";
import { storefrontApi } from "@/lib/api";
import { useCustomer } from "@/context/customer-context";
import FeedbackFormModal from "./feedback-form-modal";

export default function FeedbackPopup() {
  const { customer } = useCustomer();
  const [popupState, setPopupState] = useState<{ orderId: number; orderNumber: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!customer) return;
    storefrontApi.feedbackPopupStatus(customer.id)
      .then(res => {
        if (res.show && res.orderId) {
          setPopupState({ orderId: res.orderId, orderNumber: res.orderNumber! });
          setVisible(true);
        }
      })
      .catch(() => {});
  }, [customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = async () => {
    setVisible(false);
    if (customer && popupState) {
      storefrontApi.dismissFeedbackPopup(customer.id, popupState.orderId).catch(() => {});
    }
  };

  const handleGiveFeedback = () => {
    setVisible(false);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleFormSubmitted = () => {
    setShowForm(false);
    setPopupState(null);
  };

  if (!mounted || !customer || !popupState) return null;

  return (
    <>
      {showForm && (
        <FeedbackFormModal
          customerId={customer.id}
          orderId={popupState.orderId}
          orderNumber={popupState.orderNumber}
          onClose={handleFormClose}
          onSubmitted={handleFormSubmitted}
        />
      )}

      {visible && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] w-full max-w-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[var(--sage-light)] p-5 relative">
            {/* Close X */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full hover:bg-[var(--sage-light)] transition"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--brand-light)] flex items-center justify-center shrink-0">
                <MessageCircleHeart className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div>
                <p className="font-bold text-stone-800 text-sm leading-snug">How was your last order? 💕</p>
                <p className="text-stone-500 text-xs mt-1">We&apos;d love your feedback on order {popupState.orderNumber}!</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGiveFeedback}
                className="flex-1 py-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold transition"
              >
                Give Feedback
              </button>
              <button
                onClick={dismiss}
                className="px-4 py-2 rounded-xl border border-[var(--sage-light)] text-stone-500 text-sm font-medium hover:bg-[var(--sage-light)] transition"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
