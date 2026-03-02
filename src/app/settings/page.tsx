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

interface AppSettings {
  forceUpdate: boolean;
  minVersion: string;
  updateMessage: string;
  playStoreUrl: string;
  appStoreUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
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
                    <Badge variant={maintenanceMode ? "destructive" : "secondary"}>
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
