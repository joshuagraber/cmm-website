import { LoginForm } from "@/components/admin/login-form";
import { getConfiguredAdminProviders } from "@/lib/auth";

export default function AdminLoginPage() {
  const providers = getConfiguredAdminProviders();

  return (
    <section className="px-site-x py-section-y">
      <div className="mb-8 max-w-3xl">
        <p className="mb-3 font-bold uppercase tracking-[0.16em]">Admin</p>
        <h1 className="font-serif text-6xl font-black leading-none">Sign in</h1>
      </div>
      <LoginForm
        providers={providers}
        credentialsEnabled={providers.some(
          (provider) => provider.id === "credentials",
        )}
      />
    </section>
  );
}
