import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const { mode, error } = await searchParams;
  const formMode = mode === "join" ? "join" : "login";
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{formMode === "join" ? "Join Connection" : "Log in"}</h1>
        <p className="text-sm text-muted-foreground">
          {formMode === "join"
            ? "Enter the invite code you received and your email. We'll email you a link to finish joining."
            : "We'll email you a link. No password needed."}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          That login link didn&apos;t work or has expired. Please request a new one.
        </p>
      )}
      <LoginForm key={formMode} mode={formMode} />
    </main>
  );
}
