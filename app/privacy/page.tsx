"use client";

import Image from "next/image";
import { useEffect } from "react";

export default function PrivacyPolicyPage() {
  // Set document title for client component
  useEffect(() => {
    document.title = "KOE DB | Privacy Policy";
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/images/University_of_Cyprus.svg"
                width={40}
                height={40}
                alt="University of Cyprus Logo"
                className="h-7 w-7 flex-shrink-0 mr-3"
              />
              <span className="text-xl font-medium text-foreground">CypERC DB</span>
            </div>
            <h1 className="text-3xl font-bold mb-3 text-foreground">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">Last Updated: September 11, 2025</p>
            <div className="w-16 h-0.5 bg-secondary mx-auto mt-4 rounded-full"></div>
          </div>

          {/* Content Section */}
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">

              <div className="text-center mb-6">
                <h2 className="text-lg font-medium mb-2 text-foreground">University of Cyprus - Economics Research Centre</h2>
                <p className="text-sm text-muted-foreground">
                  The University of Cyprus Economics Research Centre (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our centralised database for economic indicators (the &quot;Service&quot;). By using the Service, you agree to the terms of this Privacy Policy.
                </p>
              </div>

              <div className="space-y-8">
                <section className="pb-6 border-b border-border/30">
                  <h3 className="text-base font-medium mb-3 text-foreground flex items-center">
                    <div className="w-1 h-4 bg-secondary mr-3 rounded-full"></div>
                    Information We Collect
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    We collect only the minimum personal information necessary to provide and maintain the Service. This includes:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• <span className="text-foreground font-medium">Email Address</span>: Used for account verification, password reset purposes, and to identify users within the platform.</li>
                    <li>• <span className="text-foreground font-medium">First Name and Last Name</span>: Collected during account creation to identify users and facilitate collaboration.</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">
                    We do not collect or use your personal information for marketing, communication, or any purpose unrelated to the operation of the Service.
                  </p>
                </section>

                <section className="pb-6 border-b border-border/30">
                  <h3 className="text-base font-medium mb-3 text-foreground flex items-center">
                    <div className="w-1 h-4 bg-secondary mr-3 rounded-full"></div>
                    How We Use Your Information
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    We use your personal information for the following purposes:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• <span className="text-foreground font-medium">Account Creation and Management</span>: To verify your identity and allow you to access the Service.</li>
                    <li>• <span className="text-foreground font-medium">Password Recovery</span>: To send password reset instructions if you request them.</li>
                    <li>• <span className="text-foreground font-medium">User Search and Collaboration</span>: To allow users to search for and identify other users within the platform for collaboration purposes.</li>
                    <li>• <span className="text-foreground font-medium">Service Maintenance</span>: To ensure the proper functioning of the Service.</li>
                  </ul>
                </section>

                <section className="pb-6 border-b border-border/30">
                  <h3 className="text-base font-medium mb-3 text-foreground flex items-center">
                    <div className="w-1 h-4 bg-secondary mr-3 rounded-full"></div>
                    Visibility of User Information
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your <span className="text-foreground font-medium">email address</span>, <span className="text-foreground font-medium">first name</span>, and <span className="text-foreground font-medium">last name</span> are visible to all users of the platform. This is necessary to facilitate collaboration and ensure transparency within the platform. Users can search for other users by name or email.
                  </p>
                </section>

                <section className="pb-6 border-b border-border/30">
                  <h3 className="text-base font-medium mb-3 text-foreground flex items-center">
                    <div className="w-1 h-4 bg-secondary mr-3 rounded-full"></div>
                    Action Logs
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    We log user actions related to specific indicators (e.g., data updates, indicator edits, and indicator creations) to maintain a record of changes and ensure accountability. These logs may include:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• The action performed (e.g., edit, create, delete).</li>
                    <li>• The timestamp of the action.</li>
                    <li>• Details of the changes made.</li>
                    <li>• The name and email of the user who performed the action.</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">
                    If other users have access rights to the same indicators, they may view these action logs. This is necessary for collaboration and transparency within the platform.
                  </p>
                </section>

                <section className="pb-6 border-b border-border/30">
                  <h3 className="text-base font-medium mb-3 text-foreground flex items-center">
                    <div className="w-1 h-4 bg-secondary mr-3 rounded-full"></div>
                    Permissions Management
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Users with <span className="text-foreground font-medium">edit access</span> to an indicator can manage permissions for that indicator. This includes:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• Granting or revoking access to other users.</li>
                    <li>• Modifying the level of access (e.g., view, edit, delete).</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Permission changes are logged and visible to other users with access to the same indicator.
                  </p>
                </section>

                <section className="pb-6 border-b border-border/30">
                  <h3 className="text-base font-medium mb-3 text-foreground flex items-center">
                    <div className="w-1 h-4 bg-secondary mr-3 rounded-full"></div>
                    Cookies
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    We use cookies to manage user authentication and maintain session security. Specifically:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• <span className="text-foreground font-medium">Access Tokens</span>: Used to authenticate your session and provide access to the platform.</li>
                    <li>• <span className="text-foreground font-medium">Refresh Tokens</span>: Used to maintain your session and re-authenticate you when your access token expires.</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">
                    These cookies are strictly necessary for the operation of the Service and do not track your activity outside the platform.
                  </p>
                </section>

                <section className="pb-6 border-b border-border/30">
                  <h3 className="text-base font-medium mb-3 text-foreground flex items-center">
                    <div className="w-1 h-4 bg-secondary mr-3 rounded-full"></div>
                    Data Security
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    We take appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These measures include:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• <span className="text-foreground font-medium">Encryption in Transit</span>: All data transmitted between your browser and our servers is encrypted using HTTPS (TLS 1.2 or higher).</li>
                    <li>• <span className="text-foreground font-medium">Encryption at Rest</span>: Data stored on our servers is encrypted using industry-standard encryption protocols.</li>
                    <li>• <span className="text-foreground font-medium">Access Controls</span>: Access to personal data is restricted to authorized personnel only, and all access is logged and monitored.</li>
                    <li>• <span className="text-foreground font-medium">Secure Authentication</span>: User authentication is managed using secure tokens, and passwords are stored using secure hashing algorithms.</li>
                  </ul>
                </section>

                <section className="pb-6 border-b border-border/30">
                  <h3 className="text-base font-medium mb-3 text-foreground flex items-center">
                    <div className="w-1 h-4 bg-secondary mr-3 rounded-full"></div>
                    Data Storage Location
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your data is stored on servers located in Germany, within the European Union (EU). This ensures compliance with the <span className="text-foreground font-medium">General Data Protection Regulation (GDPR)</span> and other applicable data protection laws.
                  </p>
                </section>

                <section className="pb-6 border-b border-border/30">
                  <h3 className="text-base font-medium mb-3 text-foreground flex items-center">
                    <div className="w-1 h-4 bg-secondary mr-3 rounded-full"></div>
                    Data Retention
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We retain your personal information only as long as necessary to provide the Service or as required by law. If you wish to delete your account, please contact us. Upon verification of your identity, we will process your request and permanently delete your account and associated data from our systems.
                  </p>
                </section>

                <section className="pb-6 border-b border-border/30">
                  <h3 className="text-base font-medium mb-3 text-foreground flex items-center">
                    <div className="w-1 h-4 bg-secondary mr-3 rounded-full"></div>
                    Account Deletion
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We currently do not provide a direct option for users to delete their accounts through the application. If you wish to delete your account, please contact us. Upon verification of your identity, we will process your request and permanently delete your account and associated data from our systems.
                  </p>
                </section>

                <section className="pb-6">
                  <h3 className="text-base font-medium mb-3 text-foreground flex items-center">
                    <div className="w-1 h-4 bg-secondary mr-3 rounded-full"></div>
                    Compliance with GDPR
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    As the Service is hosted in the European Union, we comply with the <span className="text-foreground font-medium">General Data Protection Regulation (GDPR)</span>. This means:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                    <li>• You have the right to access, correct, or delete your personal data.</li>
                    <li>• You have the right to restrict or object to the processing of your personal data.</li>
                    <li>• You have the right to data portability, allowing you to obtain and reuse your personal data for your own purposes.</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">
                    To exercise these rights, please contact us.
                  </p>
                </section>
              </div>

              {/* Footer with navigation */}
              <div className="mt-8 pt-4 border-t border-border/50 flex justify-end">
                <button
                  onClick={() => window.history.back()}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
