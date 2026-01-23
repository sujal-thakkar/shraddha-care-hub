import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Search, Eye, Users, IndianRupee, TrendingUp, Calendar, Mail, Phone, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Donation {
  id: string;
  name: string;
  email: string;
  phone: string;
  pan_card: string | null;
  amount: string;
  consent_to_publish: boolean;
  admin_notes: string | null;
  created_at: string;
}

interface DonorGroup {
  email: string;
  name: string;
  totalAmount: number;
  donationCount: number;
  lastDonation: string;
  consent: boolean;
  donations: Donation[];
}

export default function AdminDonations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDonor, setSelectedDonor] = useState<DonorGroup | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

  const { data: donations, isLoading } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Donation[];
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("donations")
        .update({ admin_notes: notes })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
      toast({ title: "Notes updated", description: "Admin notes have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save notes.", variant: "destructive" });
    },
  });

  // Group donations by email
  const donorGroups: DonorGroup[] = donations ? 
    Object.values(
      donations.reduce((acc, donation) => {
        const email = donation.email.toLowerCase();
        if (!acc[email]) {
          acc[email] = {
            email: donation.email,
            name: donation.name,
            totalAmount: 0,
            donationCount: 0,
            lastDonation: donation.created_at,
            consent: donation.consent_to_publish,
            donations: [],
          };
        }
        acc[email].totalAmount += parseFloat(donation.amount) || 0;
        acc[email].donationCount += 1;
        acc[email].donations.push(donation);
        // Update consent if any donation has consent
        if (donation.consent_to_publish) {
          acc[email].consent = true;
        }
        // Update last donation date
        if (new Date(donation.created_at) > new Date(acc[email].lastDonation)) {
          acc[email].lastDonation = donation.created_at;
        }
        return acc;
      }, {} as Record<string, DonorGroup>)
    ).sort((a, b) => b.totalAmount - a.totalAmount) : [];

  // Filter based on search
  const filteredDonors = donorGroups.filter(donor => 
    donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDonations = donations?.filter(donation =>
    donation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donation.amount.includes(searchTerm)
  );

  // Stats
  const totalDonations = donations?.length || 0;
  const totalAmount = donations?.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) || 0;
  const uniqueDonors = donorGroups.length;
  const consentedDonors = donorGroups.filter(d => d.consent).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Donations</h1>
        <p className="text-muted-foreground">Track and manage donor contributions.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Raised</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
            <Heart className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalDonations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Donors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{uniqueDonors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Public Recognition</CardTitle>
            <Check className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{consentedDonors}</div>
            <p className="text-xs text-muted-foreground">donors consented</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search donors by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs: Donors vs All Donations */}
      <Tabs defaultValue="donors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="donors">By Donor ({uniqueDonors})</TabsTrigger>
          <TabsTrigger value="all">All Donations ({totalDonations})</TabsTrigger>
        </TabsList>

        {/* Donors View - Grouped */}
        <TabsContent value="donors">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Donors</CardTitle>
              <CardDescription>Grouped by email, sorted by total contribution</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredDonors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Total Donated</TableHead>
                      <TableHead className="text-center">Donations</TableHead>
                      <TableHead>Last Donation</TableHead>
                      <TableHead>Recognition</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDonors.map((donor) => (
                      <TableRow key={donor.email}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{donor.name}</p>
                            <p className="text-sm text-muted-foreground">{donor.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          {formatCurrency(donor.totalAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{donor.donationCount}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(donor.lastDonation), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          {donor.consent ? (
                            <Badge variant="default" className="bg-primary/10 text-primary">
                              <Check className="h-3 w-3 mr-1" /> Consented
                            </Badge>
                          ) : (
                            <Badge variant="outline">Private</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedDonor(donor)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> View History
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="font-serif">Donation History: {donor.name}</DialogTitle>
                                <DialogDescription>
                                  {donor.donationCount} donation(s) totaling {formatCurrency(donor.totalAmount)}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                {donor.donations.map((donation) => (
                                  <Card key={donation.id} className="border-border">
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-start mb-3">
                                        <div>
                                          <p className="text-lg font-bold text-primary">
                                            {formatCurrency(parseFloat(donation.amount) || 0)}
                                          </p>
                                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(donation.created_at), "dd MMM yyyy, hh:mm a")}
                                          </p>
                                        </div>
                                        {donation.consent_to_publish && (
                                          <Badge variant="default" className="bg-primary/10 text-primary">
                                            Public OK
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <Phone className="h-3 w-3" />
                                          {donation.phone}
                                        </div>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <Mail className="h-3 w-3" />
                                          {donation.email}
                                        </div>
                                        {donation.pan_card && (
                                          <div className="text-muted-foreground col-span-2">
                                            PAN: {donation.pan_card}
                                          </div>
                                        )}
                                      </div>
                                      {donation.admin_notes && (
                                        <div className="mt-3 p-2 bg-accent rounded text-sm">
                                          <strong>Notes:</strong> {donation.admin_notes}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No donors found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Donations View */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">All Donations</CardTitle>
              <CardDescription>Individual donation records</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredDonations && filteredDonations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>PAN</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDonations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(donation.created_at), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{donation.name}</p>
                            <p className="text-sm text-muted-foreground">{donation.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          {formatCurrency(parseFloat(donation.amount) || 0)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {donation.phone}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {donation.pan_card || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedDonation(donation);
                                  setAdminNotes(donation.admin_notes || "");
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="font-serif">Donation Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Donor</p>
                                    <p className="font-medium">{donation.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Amount</p>
                                    <p className="font-bold text-primary">
                                      {formatCurrency(parseFloat(donation.amount) || 0)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p>{donation.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p>{donation.phone}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">PAN Card</p>
                                    <p>{donation.pan_card || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Date</p>
                                    <p>{format(new Date(donation.created_at), "dd MMM yyyy, hh:mm a")}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-sm text-muted-foreground">Public Recognition</p>
                                    <p>
                                      {donation.consent_to_publish ? (
                                        <Badge className="bg-primary/10 text-primary">Consented</Badge>
                                      ) : (
                                        <Badge variant="outline">Private</Badge>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">Admin Notes</p>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add internal notes about this donation..."
                                    rows={3}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => updateNotesMutation.mutate({ 
                                      id: donation.id, 
                                      notes: adminNotes 
                                    })}
                                    disabled={updateNotesMutation.isPending}
                                  >
                                    Save Notes
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No donations found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
