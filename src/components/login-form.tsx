import { useState, type FormEvent } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function LoginForm() {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(username, password, otp);
      // Full navigation so AuthGate remounts with a clean cookie read
      // (avoids SPA races with logout / stale session state).
      window.location.assign("/courts");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.sessionError"));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Alert className="md-banner">
        <AlertTitle className="flex items-center gap-2">
          <LockKeyhole className="size-4" /> {t("login.liveTitle")}
        </AlertTitle>
        <AlertDescription>{t("login.liveBody")}</AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="username">{t("login.user")}</Label>
        <Input
          id="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={4}
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("login.password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="otp">{t("login.otp")}</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder={t("login.otpHint")}
          disabled={pending}
        />
      </div>

      {error ? (
        <p className="md-banner md-banner-error">{error}</p>
      ) : null}

      <p className="text-center text-sm text-[color:var(--uji-ink)]/70">
        {t("login.slowNotice")}
      </p>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {pending ? t("login.connecting") : t("login.submit")}
      </Button>

      <p className="text-center text-xs text-[color:var(--uji-ink)]/55">
        {t("app.sportsService")}
      </p>
    </form>
  );
}
