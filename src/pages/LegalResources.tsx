import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FAQSection } from "@/components/legal/FAQSection";
import { Scale, Shield, FileText, AlertTriangle, Upload, CheckCircle, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkRateLimit } from "@/lib/rate-limit";
import legalAwarenessHover from "@/assets/legal-awareness-hover.jpg";
import elderCareIllustration from "@/assets/elder-care-illustration.jpg";

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_EXTENSIONS = ".jpg, .jpeg, .png, .gif, .webp, .mp4, .mov, .webm, .pdf, .doc, .docx";

// Zod schema for form validation
const abuseReportSchema = z.object({
  isAnonymous: z.boolean().default(false),
  reporterName: z.string().max(100, "Name must be less than 100 characters").optional(),
  reporterContact: z.string().max(255, "Contact must be less than 255 characters").optional(),
  reporterRelationship: z.string().max(100, "Relationship must be less than 100 characters").optional(),
  victimName: z.string().min(1, "Victim's name is required").max(100, "Name must be less than 100 characters"),
  victimAge: z.string().optional().refine((val) => !val || (parseInt(val) >= 0 && parseInt(val) <= 150), {
    message: "Please enter a valid age",
  }),
  victimLocation: z.string().min(1, "Location is required").max(500, "Location must be less than 500 characters"),
  abuseType: z.enum(["physical", "emotional", "financial", "neglect", "other"], {
    required_error: "Please select the type of abuse",
  }),
  description: z.string().min(10, "Please provide at least 10 characters of description").max(5000, "Description must be less than 5000 characters"),
}).refine((data) => {
  // If not anonymous, reporter name and contact are recommended but not required
  return true;
}, {});

type AbuseReportFormValues = z.infer<typeof abuseReportSchema>;

interface FileWithError {
  file: File;
  error?: string;
}

export default function LegalResources() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<AbuseReportFormValues>({
    resolver: zodResolver(abuseReportSchema),
    defaultValues: {
      isAnonymous: false,
      reporterName: "",
      reporterContact: "",
      reporterRelationship: "",
      victimName: "",
      victimAge: "",
      victimLocation: "",
      abuseType: undefined,
      description: "",
    },
  });

  const isAnonymous = form.watch("isAnonymous");

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" is too large. Maximum size is 10MB.`;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `"${file.name}" is not a supported file type. Allowed: ${ALLOWED_EXTENSIONS}`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const errors: string[] = [];
      const validFiles: File[] = [];

      newFiles.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        setFileErrors(errors);
        toast({
          title: "Some files were not added",
          description: errors[0] + (errors.length > 1 ? ` (+${errors.length - 1} more issues)` : ""),
          variant: "destructive",
        });
      } else {
        setFileErrors([]);
      }

      setFiles((prev) => [...prev, ...validFiles]);
    }
    // Reset input to allow re-selecting same file
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileErrors([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = async (data: AbuseReportFormValues) => {
    setIsSubmitting(true);

    try {
      // Check rate limit using reporter contact (skip for anonymous reports)
      if (!data.isAnonymous && data.reporterContact) {
        const rateCheck = await checkRateLimit(data.reporterContact, 'abuse_reports');
        if (!rateCheck.allowed) {
          toast({
            title: "Too Many Submissions",
            description: rateCheck.message || "Please try again later.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Insert the abuse report
      const { data: report, error: reportError } = await supabase
        .from("abuse_reports")
        .insert({
          reporter_name: data.isAnonymous ? null : data.reporterName || null,
          reporter_contact: data.isAnonymous ? null : data.reporterContact || null,
          reporter_relationship: data.isAnonymous ? null : data.reporterRelationship || null,
          is_anonymous: data.isAnonymous,
          victim_name: data.victimName,
          victim_age: data.victimAge ? parseInt(data.victimAge) : null,
          victim_location: data.victimLocation,
          abuse_type: data.abuseType,
          description: data.description,
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
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={legalAwarenessHover} 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/75 to-primary/90" />
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary-foreground/20 rounded-full animate-float-bounce" />
        <div className="absolute bottom-16 right-16 w-32 h-32 border-2 border-primary-foreground/10 rounded-full" />
        <div className="absolute top-1/4 right-10 w-4 h-4 bg-primary-foreground/30 rounded-full animate-pulse" />
        <div className="absolute bottom-1/3 left-16 w-6 h-6 bg-primary-foreground/20 rounded-full animate-pulse" />
        <div className="absolute top-20 right-1/4 w-16 h-16 border border-primary-foreground/15 rotate-45" />
        <div className="absolute bottom-10 left-1/4 w-12 h-12 border border-primary-foreground/10 rotate-12 rounded-lg" />
        
        {/* Content */}
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-sm font-medium border border-primary-foreground/20">
              <Scale className="h-4 w-4" />
              Know Your Rights
            </div>
            <h1 className="font-serif text-4xl lg:text-6xl font-bold text-primary-foreground drop-shadow-lg">
              Legal Resources
            </h1>
            <p className="text-lg lg:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Know your rights and report elder abuse confidentially. We're here to help protect our seniors.
            </p>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute -bottom-px left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
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

      <FAQSection />

      {/* Report Form */}
      <section className="bg-card pb-16 lg:pb-24">
        {/* Parallax Header */}
        <div 
          className="relative h-64 md:h-80 lg:h-96 mb-12 overflow-hidden"
          style={{
            backgroundImage: `url(${elderCareIllustration})`,
            backgroundAttachment: 'fixed',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/40 to-card" />
          
          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
            <AlertTriangle className="h-12 w-12 text-primary-foreground mx-auto mb-4 drop-shadow-lg" />
            <h2 className="font-serif text-3xl lg:text-5xl font-bold text-primary-foreground drop-shadow-lg mb-4">
              Report Elder Abuse
            </h2>
            <p className="text-primary-foreground/90 max-w-xl mx-auto text-lg">
              All reports are treated confidentially. You can also report anonymously.
            </p>
          </div>
        </div>

        <div className="container">
          <div id="report-elder-abuse" className="max-w-2xl mx-auto scroll-mt-24">

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
                  <Button onClick={() => {
                    setSubmitted(false);
                    form.reset();
                    setFiles([]);
                    setFileErrors([]);
                  }}>
                    Submit Another Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border">
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      {/* Anonymous Option */}
                      <FormField
                        control={form.control}
                        name="isAnonymous"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 p-4 bg-accent/50 rounded-lg space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              I wish to report anonymously
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      {/* Reporter Information */}
                      {!isAnonymous && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-foreground">Your Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="reporterName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Your Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter your name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="reporterContact"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contact Number/Email</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Phone or email" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="reporterRelationship"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relationship to Victim</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Neighbor, Family Friend, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Victim Information */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Victim Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="victimName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Victim's Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter victim's name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="victimAge"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Victim's Age</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="Approximate age" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="victimLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location *</FormLabel>
                              <FormControl>
                                <Input placeholder="City, State, or full address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Abuse Details */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Abuse Details</h3>
                        <FormField
                          control={form.control}
                          name="abuseType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type of Abuse *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type of abuse" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="physical">Physical Abuse</SelectItem>
                                  <SelectItem value="emotional">Emotional/Psychological Abuse</SelectItem>
                                  <SelectItem value="financial">Financial Exploitation</SelectItem>
                                  <SelectItem value="neglect">Neglect</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Please describe the incident or situation in detail..."
                                  className="min-h-[150px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Evidence Upload */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Evidence (Optional)</h3>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <Label htmlFor="evidence" className="cursor-pointer">
                            <span className="text-primary hover:underline">Click to upload</span>
                            <span className="text-muted-foreground"> photos, videos, or documents</span>
                          </Label>
                          <Input
                            id="evidence"
                            type="file"
                            multiple
                            accept={ALLOWED_FILE_TYPES.join(",")}
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Max 10MB per file. Supported: {ALLOWED_EXTENSIONS}
                          </p>
                        </div>

                        {/* File Errors */}
                        {fileErrors.length > 0 && (
                          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm font-medium text-destructive mb-1">Some files could not be added:</p>
                            <ul className="text-xs text-destructive space-y-1">
                              {fileErrors.map((error, i) => (
                                <li key={i}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Selected Files */}
                        {files.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">{files.length} file(s) selected:</p>
                            <div className="space-y-2">
                              {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm truncate">{file.name}</span>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                      ({formatFileSize(file.size)})
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 flex-shrink-0"
                                    onClick={() => removeFile(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button type="submit" className="w-full" disabled={isSubmitting}>
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
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
