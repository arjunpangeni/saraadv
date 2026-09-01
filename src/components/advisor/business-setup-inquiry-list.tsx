import { type ReactNode } from "react";
import {
  BusinessSetupInquiryRow,
  type BusinessSetupInquiryCard,
} from "@/components/advisor/business-setup-inquiry-row";
import { cn } from "@/lib/utils";

export function BusinessSetupInquiryList({
  inquiries,
  empty,
  manage = false,
}: {
  inquiries: BusinessSetupInquiryCard[];
  empty?: ReactNode;
  manage?: boolean;
}) {
  if (inquiries.length === 0) return empty ?? null;

  return (
    <div className={cn(manage ? "space-y-3" : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3")}>
      {inquiries.map((inquiry) => (
        <BusinessSetupInquiryRow key={inquiry.id} inquiry={inquiry} manage={manage} />
      ))}
    </div>
  );
}
