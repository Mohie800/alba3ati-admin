"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

interface ContactDetail {
  _id: string;
  playerName: string;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
  source: "app" | "landing";
  status: string;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export default function ContactDetailPage() {
  const { id } = useParams();
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [response, setResponse] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get(`/admin/contacts/${id}`);
        setContact(data.data.contact);
      } catch {
        /* handled by interceptor */
      }
    }
    fetch();
  }, [id]);

  const handleRespond = async () => {
    if (!response.trim()) return;
    setSending(true);
    try {
      const { data } = await api.put(`/admin/contacts/${id}/respond`, {
        response: response.trim(),
      });
      setContact(data.data.contact);
      setResponse("");
    } catch {
      /* handled by interceptor */
    } finally {
      setSending(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "new") return "destructive" as const;
    if (s === "read") return "outline" as const;
    return "default" as const;
  };

  return (
    <>
      <PageHeader
        title={contact?.subject || "Contact"}
        backHref="/contacts"
        backLabel="Back to Contacts"
        actions={
          contact ? (
            <Badge variant={statusColor(contact.status)}>{contact.status}</Badge>
          ) : null
        }
      />
      {!contact ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                    From
                  </p>
                  <p className="font-medium">{contact.playerName}</p>
                </div>
                {contact.email && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                      Email
                    </p>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-primary hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                      Phone
                    </p>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-primary hover:underline"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                    Source
                  </p>
                  <Badge
                    variant={
                      contact.source === "landing" ? "secondary" : "outline"
                    }
                  >
                    {contact.source === "landing" ? "Website" : "App"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                    Date
                  </p>
                  <p>{new Date(contact.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-muted/60 border rounded-lg p-4">
                <p className="whitespace-pre-wrap text-sm">{contact.message}</p>
              </div>
            </CardContent>
          </Card>

          {contact.adminResponse ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Admin Response</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{contact.adminResponse}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Responded {new Date(contact.respondedAt!).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Send Response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your response…"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={handleRespond}
                  disabled={sending || !response.trim()}
                >
                  {sending ? "Sending…" : "Send Response"}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}
