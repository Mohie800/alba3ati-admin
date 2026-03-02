"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
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
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <Link href="/contacts" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
            &larr; Back to Contacts
          </Link>
          {contact ? (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {contact.subject}
                    <Badge variant={statusColor(contact.status)}>{contact.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>From: {contact.playerName}</p>
                    {contact.email && <p>Email: <a href={`mailto:${contact.email}`} className="text-blue-500 hover:underline">{contact.email}</a></p>}
                    {contact.phone && <p>Phone: <a href={`tel:${contact.phone}`} className="text-blue-500 hover:underline">{contact.phone}</a></p>}
                    <p>Source: <Badge variant={contact.source === "landing" ? "secondary" : "outline"}>{contact.source === "landing" ? "Website" : "App"}</Badge></p>
                    <p>Date: {new Date(contact.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{contact.message}</p>
                  </div>
                </CardContent>
              </Card>

              {contact.adminResponse ? (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-base">Admin Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{contact.adminResponse}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Responded: {new Date(contact.respondedAt!).toLocaleString()}
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
                      placeholder="Type your response..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={4}
                    />
                    <Button onClick={handleRespond} disabled={sending || !response.trim()}>
                      {sending ? "Sending..." : "Send Response"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
