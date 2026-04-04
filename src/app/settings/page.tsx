"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface CommunityPlatform {
  url: string;
  enabled: boolean;
}

interface CommunityLinks {
  enabled: boolean;
  whatsapp: CommunityPlatform;
  telegram: CommunityPlatform;
  discord: CommunityPlatform;
}

interface CoinRewards {
  gameComplete: number;
  gameWin: number;
  adReward: number;
  maxAdsPerDay: number;
}

interface AppSettings {
  forceUpdate: boolean;
  minVersion: string;
  updateMessage: string;
  playStoreUrl: string;
  appStoreUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  coinRewards: CoinRewards;
  communityLinks: CommunityLinks;
  updatedAt: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [forceUpdate, setForceUpdate] = useState(false);
  const [minVersion, setMinVersion] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [gameComplete, setGameComplete] = useState(10);
  const [gameWin, setGameWin] = useState(20);
  const [adReward, setAdReward] = useState(15);
  const [maxAdsPerDay, setMaxAdsPerDay] = useState(5);
  const [communityEnabled, setCommunityEnabled] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [telegramUrl, setTelegramUrl] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [discordUrl, setDiscordUrl] = useState("");
  const [discordEnabled, setDiscordEnabled] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get("/admin/app-settings");
      const s = data.data;
      setSettings(s);
      setForceUpdate(s.forceUpdate);
      setMinVersion(s.minVersion);
      setUpdateMessage(s.updateMessage);
      setPlayStoreUrl(s.playStoreUrl);
      setAppStoreUrl(s.appStoreUrl);
      setMaintenanceMode(s.maintenanceMode);
      setMaintenanceMessage(s.maintenanceMessage);
      const cr = s.coinRewards || {};
      setGameComplete(cr.gameComplete ?? 10);
      setGameWin(cr.gameWin ?? 20);
      setAdReward(cr.adReward ?? 15);
      setMaxAdsPerDay(cr.maxAdsPerDay ?? 5);
      const cl = s.communityLinks || {};
      setCommunityEnabled(cl.enabled || false);
      setWhatsappUrl(cl.whatsapp?.url || "");
      setWhatsappEnabled(cl.whatsapp?.enabled || false);
      setTelegramUrl(cl.telegram?.url || "");
      setTelegramEnabled(cl.telegram?.enabled || false);
      setDiscordUrl(cl.discord?.url || "");
      setDiscordEnabled(cl.discord?.enabled || false);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  };

  const [saveError, setSaveError] = useState("");

  const isValidUrl = (url: string) => {
    if (!url) return true; // optional
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidVersion = (v: string) => {
    if (!v) return true; // optional
    return /^\d+\.\d+\.\d+$/.test(v);
  };

  const handleSave = async () => {
    setSaveError("");

    if (minVersion && !isValidVersion(minVersion)) {
      setSaveError("Version must be in format X.Y.Z (e.g. 1.2.0)");
      return;
    }
    if (!isValidUrl(playStoreUrl)) {
      setSaveError("Invalid Play Store URL");
      return;
    }
    if (!isValidUrl(appStoreUrl)) {
      setSaveError("Invalid App Store URL");
      return;
    }
    if (!isValidUrl(whatsappUrl)) {
      setSaveError("Invalid WhatsApp URL");
      return;
    }
    if (!isValidUrl(telegramUrl)) {
      setSaveError("Invalid Telegram URL");
      return;
    }
    if (!isValidUrl(discordUrl)) {
      setSaveError("Invalid Discord URL");
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.put("/admin/app-settings", {
        forceUpdate,
        minVersion,
        updateMessage,
        playStoreUrl,
        appStoreUrl,
        maintenanceMode,
        maintenanceMessage,
        coinRewards: {
          gameComplete,
          gameWin,
          adReward,
          maxAdsPerDay,
        },
        communityLinks: {
          enabled: communityEnabled,
          whatsapp: { url: whatsappUrl, enabled: whatsappEnabled },
          telegram: { url: telegramUrl, enabled: telegramEnabled },
          discord: { url: discordUrl, enabled: discordEnabled },
        },
      });
      setSettings(data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h1 className="text-xl md:text-2xl font-bold">App Settings</h1>
            {settings && (
              <span className="text-sm text-muted-foreground">
                Last updated: {new Date(settings.updatedAt).toLocaleString()}
              </span>
            )}
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-6 max-w-2xl">
              {/* Force Update Toggle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    Force Update
                    <Badge variant={forceUpdate ? "destructive" : "secondary"}>
                      {forceUpdate ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    When enabled, users with an app version below the minimum
                    will be forced to update before they can use the app.
                  </p>
                  <Button
                    variant={forceUpdate ? "outline" : "destructive"}
                    onClick={() => setForceUpdate(!forceUpdate)}
                  >
                    {forceUpdate
                      ? "Disable Force Update"
                      : "Enable Force Update"}
                  </Button>
                </CardContent>
              </Card>

              {/* Maintenance Mode Toggle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    Maintenance Mode
                    <Badge
                      variant={maintenanceMode ? "destructive" : "secondary"}
                    >
                      {maintenanceMode ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    When enabled, players cannot create or join new rooms.
                    Existing games and reconnections are not affected.
                  </p>
                  <Button
                    variant={maintenanceMode ? "outline" : "destructive"}
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                  >
                    {maintenanceMode
                      ? "Disable Maintenance Mode"
                      : "Enable Maintenance Mode"}
                  </Button>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Maintenance Message (Arabic)
                    </label>
                    <Textarea
                      placeholder="اللعبة تحت الصيانة حالياً، يرجى المحاولة لاحقاً"
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Version & Message */}
              <Card>
                <CardHeader>
                  <CardTitle>Coin Rewards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configure how many coins players earn from different
                    actions.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Game Complete
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={gameComplete}
                        onChange={(e) =>
                          setGameComplete(Number(e.target.value))
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Coins for finishing a game
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Game Win
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={gameWin}
                        onChange={(e) => setGameWin(Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Coins for winning a game
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Ad Reward
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={adReward}
                        onChange={(e) => setAdReward(Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Coins per ad watched
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Max Ads Per Day
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={maxAdsPerDay}
                        onChange={(e) =>
                          setMaxAdsPerDay(Number(e.target.value))
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Daily ad watch limit
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Version & Message */}
              <Card>
                <CardHeader>
                  <CardTitle>Update Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Minimum Required Version
                    </label>
                    <Input
                      placeholder="e.g. 1.1.0"
                      value={minVersion}
                      onChange={(e) => setMinVersion(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Users with a version below this will see the update screen
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Update Message (Arabic)
                    </label>
                    <Textarea
                      placeholder="يرجى تحديث التطبيق للاستمرار"
                      value={updateMessage}
                      onChange={(e) => setUpdateMessage(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Store URLs */}
              <Card>
                <CardHeader>
                  <CardTitle>Store Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Google Play Store URL
                    </label>
                    <Input
                      placeholder="https://play.google.com/store/apps/details?id=com.alba3ati.app"
                      value={playStoreUrl}
                      onChange={(e) => setPlayStoreUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Apple App Store URL
                    </label>
                    <Input
                      placeholder="https://apps.apple.com/app/..."
                      value={appStoreUrl}
                      onChange={(e) => setAppStoreUrl(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Community Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    Community Links
                    <Badge variant={communityEnabled ? "default" : "secondary"}>
                      {communityEnabled ? "Visible" : "Hidden"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    Show &quot;انضم لمجتمع اللاعبين&quot; section in the app
                    home screen and the landing page footer. Toggle individual
                    platforms below.
                  </p>
                  <Button
                    variant={communityEnabled ? "outline" : "default"}
                    onClick={() => setCommunityEnabled(!communityEnabled)}
                  >
                    {communityEnabled
                      ? "Hide Community Section"
                      : "Show Community Section"}
                  </Button>

                  {/* WhatsApp */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5 fill-[#25D366]"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        WhatsApp
                      </span>
                      <Button
                        size="sm"
                        variant={whatsappEnabled ? "default" : "outline"}
                        onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                      >
                        {whatsappEnabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    <Input
                      placeholder="https://chat.whatsapp.com/..."
                      value={whatsappUrl}
                      onChange={(e) => setWhatsappUrl(e.target.value)}
                    />
                  </div>

                  {/* Telegram */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5 fill-[#0088cc]"
                        >
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                        Telegram
                      </span>
                      <Button
                        size="sm"
                        variant={telegramEnabled ? "default" : "outline"}
                        onClick={() => setTelegramEnabled(!telegramEnabled)}
                      >
                        {telegramEnabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    <Input
                      placeholder="https://t.me/..."
                      value={telegramUrl}
                      onChange={(e) => setTelegramUrl(e.target.value)}
                    />
                  </div>

                  {/* Discord */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5 fill-[#5865F2]"
                        >
                          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                        </svg>
                        Discord
                      </span>
                      <Button
                        size="sm"
                        variant={discordEnabled ? "default" : "outline"}
                        onClick={() => setDiscordEnabled(!discordEnabled)}
                      >
                        {discordEnabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    <Input
                      placeholder="https://discord.gg/..."
                      value={discordUrl}
                      onChange={(e) => setDiscordUrl(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={saving} size="lg">
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
                {saved && (
                  <span className="text-sm text-green-500 font-medium">
                    Settings saved successfully!
                  </span>
                )}
                {saveError && (
                  <span className="text-sm text-destructive font-medium">
                    {saveError}
                  </span>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
