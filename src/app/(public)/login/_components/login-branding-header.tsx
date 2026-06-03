import { Shield } from "lucide-react";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/core/constants";

export function LoginBrandingHeader() {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
        <Shield className="w-7 h-7 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-theme-primary">{PRODUCT_NAME}</h1>
      <p className="text-sm text-theme-muted mt-1">{PRODUCT_TAGLINE}</p>
    </div>
  );
}
