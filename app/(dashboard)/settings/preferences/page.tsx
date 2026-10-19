import { PaymentPreferencesSettings } from "@/components/settings/PaymentPreferencesForm";
import { LanguagePreferenceSection } from "@/components/settings/LanguagePreferenceSection";

export default function PaymentPreferencesPage() {
  return (
    <div className="space-y-6">
      <PaymentPreferencesSettings />
      <LanguagePreferenceSection />
    </div>
  );
}
