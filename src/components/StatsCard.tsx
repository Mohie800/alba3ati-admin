import { Card, CardContent } from "@/components/ui/card";
import { type ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
}

export default function StatsCard({ label, value, icon }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
