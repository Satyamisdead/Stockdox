
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

export default function GamesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-10">
      <Card className="w-full max-w-md shadow-xl animate-pulse hover:shadow-primary/30 transition-shadow duration-300">
        <CardHeader className="items-center text-center">
          <Gamepad2 className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">Games</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-xl text-muted-foreground">
            Coming Soon!
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Get ready for exciting new interactive experiences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
