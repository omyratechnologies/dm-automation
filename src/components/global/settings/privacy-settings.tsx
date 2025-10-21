"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function PrivacySettings() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy & Security
        </CardTitle>
        <CardDescription>
          Manage your privacy settings and data preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Privacy */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4" />
              Data & Privacy
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Control how your data is used and stored
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics">Analytics & Performance</Label>
                <p className="text-sm text-muted-foreground">
                  Help us improve by sharing usage data
                </p>
              </div>
              <Switch id="analytics" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing">Marketing Communications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features and tips
                </p>
              </div>
              <Switch id="marketing" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Privacy Policy */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4" />
              Legal & Compliance
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              View our privacy policy and terms of service
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/privacy-policy">
              <Button variant="outline" className="w-full justify-start">
                Privacy Policy
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start">
              Terms of Service
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Data Processing Agreement
            </Button>
          </div>
        </div>

        <Separator />

        {/* Data Export */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Your Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Download or manage your data
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full justify-start">
              Download My Data
            </Button>
            <Button variant="outline" className="w-full justify-start">
              View Data Usage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
