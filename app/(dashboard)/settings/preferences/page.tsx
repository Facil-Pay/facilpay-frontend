import { PaymentPreferencesSettings } from "@/components/settings/PaymentPreferencesForm";
import { RegionalPreferencesForm } from "@/components/settings/RegionalPreferencesForm";

export default function PaymentPreferencesPage() {
  return (
    <div className="space-y-6">
      <RegionalPreferencesForm />
      <PaymentPreferencesSettings />
    </div>
  );
}
