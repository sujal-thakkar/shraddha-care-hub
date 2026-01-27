import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, CalendarIcon, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type ProjectEvent = Database["public"]["Tables"]["projects_events"]["Row"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];
type OrganizationType = Database["public"]["Enums"]["organization_type"];

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

const ORG_OPTIONS: { value: OrganizationType; label: string }[] = [
  { value: "shraddha", label: "Shraddha" },
  { value: "hosla", label: "Hosla" },
  { value: "both", label: "Both" },
];

interface FormData {
  title: string;
  description: string;
  location: string;
  start_date: Date | undefined;
  end_date: Date | undefined;
  status: ProjectStatus;
  organization: OrganizationType;
  resource_link: string;
  is_published: boolean;
  display_order: number;
}

const defaultFormData: FormData = {
  title: "",
  description: "",
  location: "",
  start_date: undefined,
  end_date: undefined,
  status: "upcoming",
  organization: "shraddha",
  resource_link: "",
  is_published: false,
  display_order: 0,
};

export default function AdminProjectsEvents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-projects-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects_events")
        .select("*")
        .order("display_order", { ascending: true })
        .order("start_date", { ascending: true });
      
      if (error) throw error;
      return data as ProjectEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.from("projects_events").insert({
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        start_date: data.start_date ? format(data.start_date, "yyyy-MM-dd") : null!,
        end_date: data.end_date ? format(data.end_date, "yyyy-MM-dd") : null,
        status: data.status,
        organization: data.organization,
        resource_link: data.resource_link || null,
        is_published: data.is_published,
        display_order: data.display_order,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects-events"] });
      toast({ title: "Success", description: "Event created successfully." });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const { error } = await supabase
        .from("projects_events")
        .update({
          title: data.title,
          description: data.description || null,
          location: data.location || null,
          start_date: data.start_date ? format(data.start_date, "yyyy-MM-dd") : null!,
          end_date: data.end_date ? format(data.end_date, "yyyy-MM-dd") : null,
          status: data.status,
          organization: data.organization,
          resource_link: data.resource_link || null,
          is_published: data.is_published,
          display_order: data.display_order,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects-events"] });
      toast({ title: "Success", description: "Event updated successfully." });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects-events"] });
      toast({ title: "Success", description: "Event deleted successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("projects_events")
        .update({ is_published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects-events"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(defaultFormData);
  };

  const handleEdit = (event: ProjectEvent) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      start_date: event.start_date ? new Date(event.start_date) : undefined,
      end_date: event.end_date ? new Date(event.end_date) : undefined,
      status: event.status,
      organization: event.organization,
      resource_link: event.resource_link || "",
      is_published: event.is_published,
      display_order: event.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.start_date) {
      toast({ title: "Validation Error", description: "Title and start date are required.", variant: "destructive" });
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (activeTab === "all") return true;
    return event.status === activeTab;
  });

  const getStatusBadge = (status: ProjectStatus) => {
    const variants: Record<ProjectStatus, { className: string; label: string }> = {
      upcoming: { className: "bg-purple-100 text-purple-800 border-purple-200", label: "Upcoming" },
      ongoing: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "Ongoing" },
      completed: { className: "bg-gray-100 text-gray-800 border-gray-200", label: "Completed" },
    };
    const { className, label } = variants[status];
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const getOrgBadge = (org: OrganizationType) => {
    const labels: Record<OrganizationType, string> = {
      shraddha: "Shraddha",
      hosla: "Hosla",
      both: "Both",
    };
    return <Badge variant="secondary">{labels[org]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects & Events</h1>
          <p className="text-muted-foreground">Manage upcoming and ongoing projects for corporate viewers.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({events.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({events.filter(e => e.status === "upcoming").length})</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing ({events.filter(e => e.status === "ongoing").length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({events.filter(e => e.status === "completed").length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {activeTab === "all" ? "All Events" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Events`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No events found. Click "Add Event" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium max-w-[200px]">
                            <div className="truncate" title={event.title}>{event.title}</div>
                            {event.location && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {event.location}
                              </div>
                            )}
                            {event.resource_link && (
                              <a 
                                href={event.resource_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Resource
                              </a>
                            )}
                          </TableCell>
                          <TableCell>{getOrgBadge(event.organization)}</TableCell>
                          <TableCell className="text-sm">
                            <div>{format(new Date(event.start_date), "MMM d, yyyy")}</div>
                            {event.end_date && (
                              <div className="text-muted-foreground">
                                to {format(new Date(event.end_date), "MMM d, yyyy")}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(event.status)}</TableCell>
                          <TableCell>
                            <Switch
                              checked={event.is_published}
                              onCheckedChange={(checked) => 
                                togglePublishMutation.mutate({ id: event.id, is_published: checked })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(event)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{event.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(event.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Event" : "Add New Event"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the event"
                maxLength={1000}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, venue, or area"
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => setFormData({ ...formData, start_date: date })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, "PPP") : "Optional"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => setFormData({ ...formData, end_date: date })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Organization</Label>
                <Select
                  value={formData.organization}
                  onValueChange={(value: OrganizationType) => setFormData({ ...formData, organization: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource_link">Resource Link</Label>
              <Input
                id="resource_link"
                type="url"
                value={formData.resource_link}
                onChange={(e) => setFormData({ ...formData, resource_link: e.target.value })}
                placeholder="https://..."
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="is_published" className="font-medium">Publish Event</Label>
                <p className="text-sm text-muted-foreground">Make visible on the Corporate Care page</p>
              </div>
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingId ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
