import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Scale, Shield, FileText, AlertTriangle, Upload, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function LegalResources() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    reporterName: "",
    reporterContact: "",
    reporterRelationship: "",
    victimName: "",
    victimAge: "",
    victimLocation: "",
    abuseType: "",
    description: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Insert the abuse report
      const { data: report, error: reportError } = await supabase
        .from("abuse_reports")
        .insert({
          reporter_name: isAnonymous ? null : formData.reporterName,
          reporter_contact: isAnonymous ? null : formData.reporterContact,
          reporter_relationship: isAnonymous ? null : formData.reporterRelationship,
          is_anonymous: isAnonymous,
          victim_name: formData.victimName,
          victim_age: formData.victimAge ? parseInt(formData.victimAge) : null,
          victim_location: formData.victimLocation,
          abuse_type: formData.abuseType as "physical" | "emotional" | "financial" | "neglect" | "other",
          description: formData.description,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Upload evidence files if any
      if (files.length > 0 && report) {
        for (const file of files) {
          const filePath = `${report.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("abuse-evidence")
            .upload(filePath, file);

          if (uploadError) {
            console.error("File upload error:", uploadError);
            continue;
          }

          // Record the evidence in the database
          await supabase.from("report_evidence").insert({
            report_id: report.id,
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          });
        }
      }

      // Trigger email notification
      try {
        await supabase.functions.invoke("send-notification", {
          body: { type: "abuse_report", reportId: report.id },
        });
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }

      setSubmitted(true);
      toast({
        title: "Report Submitted",
        description: "Thank you. Your report has been received and will be reviewed confidentially.",
      });
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-accent to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Scale className="h-16 w-16 text-primary mx-auto" />
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-foreground">
              Legal Resources
            </h1>
            <p className="text-lg text-muted-foreground">
              Know your rights and report elder abuse confidentially.
            </p>
          </div>
        </div>
      </section>

      {/* Know Your Rights */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Know Your Rights
              </h2>
              <p className="text-muted-foreground">
                Indian laws provide strong protections for senior citizens. Here's what you should know.
              </p>
            </div>

            <div className="grid gap-6">
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <CardTitle className="font-serif">
                      Maintenance and Welfare of Parents and Senior Citizens Act, 2007
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    This act ensures that children and relatives provide maintenance to senior citizens. 
                    Key provisions include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Children are legally obligated to maintain their parents who cannot maintain themselves</li>
                    <li>Senior citizens can approach Maintenance Tribunals for relief</li>
                    <li>Maximum maintenance amount of ₹10,000 per month (varies by state)</li>
                    <li>Transfer of property to children can be revoked if parents are not maintained</li>
                    <li>Abandonment of senior citizens is a punishable offense</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <CardTitle className="font-serif">Senior Citizen Rights</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Right to receive maintenance from children and heirs</li>
                    <li>Right to live with dignity and without abuse</li>
                    <li>Right to revoke property transfer if not maintained</li>
                    <li>Right to access healthcare and welfare services</li>
                    <li>Right to protection from physical and mental abuse</li>
                    <li>Right to seek legal remedies through fast-track tribunals</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-primary" />
                    <CardTitle className="font-serif">How to Report Abuse</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    If you or someone you know is experiencing elder abuse, you can:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>File a complaint at the local police station</li>
                    <li>Contact the District Social Welfare Officer</li>
                    <li>Approach the Maintenance Tribunal in your district</li>
                    <li>Call the Elder Helpline: 14567</li>
                    <li>Report through our confidential form below</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Report Form */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <AlertTriangle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Report Elder Abuse
              </h2>
              <p className="text-muted-foreground">
                All reports are treated confidentially. You can also report anonymously.
              </p>
            </div>

            {submitted ? (
              <Card className="border-primary">
                <CardContent className="p-8 text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                  <h3 className="font-serif text-2xl font-bold text-foreground">
                    Report Submitted Successfully
                  </h3>
                  <p className="text-muted-foreground">
                    Thank you for your report. Our team will review it confidentially and take 
                    appropriate action. If you provided contact information, we may reach out 
                    for additional details.
                  </p>
                  <Button onClick={() => setSubmitted(false)}>
                    Submit Another Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Anonymous Option */}
                    <div className="flex items-center gap-2 p-4 bg-accent/50 rounded-lg">
                      <Checkbox
                        id="anonymous"
                        checked={isAnonymous}
                        onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                      />
                      <Label htmlFor="anonymous" className="text-sm">
                        I wish to report anonymously
                      </Label>
                    </div>

                    {/* Reporter Information */}
                    {!isAnonymous && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Your Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="reporterName">Your Name</Label>
                            <Input
                              id="reporterName"
                              value={formData.reporterName}
                              onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                              placeholder="Enter your name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reporterContact">Contact Number/Email</Label>
                            <Input
                              id="reporterContact"
                              value={formData.reporterContact}
                              onChange={(e) => setFormData({ ...formData, reporterContact: e.target.value })}
                              placeholder="Phone or email"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reporterRelationship">Relationship to Victim</Label>
                          <Input
                            id="reporterRelationship"
                            value={formData.reporterRelationship}
                            onChange={(e) => setFormData({ ...formData, reporterRelationship: e.target.value })}
                            placeholder="e.g., Neighbor, Family Friend, etc."
                          />
                        </div>
                      </div>
                    )}

                    {/* Victim Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground">Victim Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="victimName">Victim's Name *</Label>
                          <Input
                            id="victimName"
                            required
                            value={formData.victimName}
                            onChange={(e) => setFormData({ ...formData, victimName: e.target.value })}
                            placeholder="Enter victim's name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="victimAge">Victim's Age</Label>
                          <Input
                            id="victimAge"
                            type="number"
                            value={formData.victimAge}
                            onChange={(e) => setFormData({ ...formData, victimAge: e.target.value })}
                            placeholder="Approximate age"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="victimLocation">Location *</Label>
                        <Input
                          id="victimLocation"
                          required
                          value={formData.victimLocation}
                          onChange={(e) => setFormData({ ...formData, victimLocation: e.target.value })}
                          placeholder="City, State, or full address"
                        />
                      </div>
                    </div>

                    {/* Abuse Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground">Abuse Details</h3>
                      <div className="space-y-2">
                        <Label htmlFor="abuseType">Type of Abuse *</Label>
                        <Select
                          value={formData.abuseType}
                          onValueChange={(value) => setFormData({ ...formData, abuseType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type of abuse" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="physical">Physical Abuse</SelectItem>
                            <SelectItem value="emotional">Emotional/Psychological Abuse</SelectItem>
                            <SelectItem value="financial">Financial Exploitation</SelectItem>
                            <SelectItem value="neglect">Neglect</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          required
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Please describe the incident or situation in detail..."
                          className="min-h-[150px]"
                        />
                      </div>
                    </div>

                    {/* Evidence Upload */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground">Evidence (Optional)</h3>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <Label htmlFor="evidence" className="cursor-pointer">
                          <span className="text-primary hover:underline">Click to upload</span>
                          <span className="text-muted-foreground"> photos, videos, or documents</span>
                        </Label>
                        <Input
                          id="evidence"
                          type="file"
                          multiple
                          accept="image/*,video/*,.pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        {files.length > 0 && (
                          <div className="mt-4 text-sm text-muted-foreground">
                            {files.length} file(s) selected
                          </div>
                        )}
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting || !formData.abuseType}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Report"
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      All information is treated confidentially. False reports may be subject to legal action.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
