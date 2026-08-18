"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
            <p className="text-sm text-muted-foreground">
              Review how Gemai processes data, request an export, disconnect
              Instagram, or permanently delete your account.
            </p>
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
            <Link href="/terms">
              <Button variant="outline" className="w-full justify-start">
                Terms of Service
              </Button>
            </Link>
            <Link href="/account-deletion">
              <Button variant="outline" className="w-full justify-start">
                Account & Data Deletion
              </Button>
            </Link>
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
            <a href="mailto:support@gemai.in?subject=Gemai%20data%20export%20request">
              <Button variant="outline" className="w-full justify-start">
                Request My Data Export
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
