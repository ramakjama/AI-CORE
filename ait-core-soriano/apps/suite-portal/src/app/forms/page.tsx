"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  GripVertical,
  Trash2,
  Eye,
  Settings2,
  Copy,
  Download,
  Share2,
  FileText,
  Calendar,
  CheckSquare,
  List,
  AlignLeft,
  Hash,
  Mail,
  ExternalLink,
} from "lucide-react";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";

// Types
interface FormField {
  id: string;
  type: "text" | "email" | "number" | "date" | "select" | "checkbox" | "radio" | "textarea";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormData {
  id: string;
  title: string;
  description: string;
  redirectUrl?: string;
  fields: FormField[];
  published: boolean;
  createdAt: Date;
  submissions: number;
}

interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: Date;
}

// Validation schemas
const formSettingsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  redirectUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const fieldSchema = z.object({
  label: z.string().min(1, "Label is required"),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.string().optional(),
});

type FormSettingsInput = z.infer<typeof formSettingsSchema>;
type FieldInput = z.infer<typeof fieldSchema>;

// Field type options
const fieldTypes: { type: FormField["type"]; label: string; icon: any }[] = [
  { type: "text", label: "Text", icon: AlignLeft },
  { type: "email", label: "Email", icon: Mail },
  { type: "number", label: "Number", icon: Hash },
  { type: "date", label: "Date", icon: Calendar },
  { type: "select", label: "Select", icon: List },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "radio", label: "Radio", icon: CheckSquare },
  { type: "textarea", label: "Textarea", icon: FileText },
];

// Sortable field component
function SortableField({
  field,
  onEdit,
  onDelete,
}: {
  field: FormField;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 rounded-lg border bg-card p-4 transition-shadow",
        isDragging && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{field.label}</span>
          {field.required && <Badge variant="secondary">Required</Badge>}
        </div>
        <span className="text-sm text-muted-foreground capitalize">{field.type}</span>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Settings2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Preview component
function FormPreview({ form }: { form: Partial<FormData> }) {
  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h2 className="text-2xl font-bold">{form.title || "Untitled Form"}</h2>
        {form.description && (
          <p className="mt-2 text-muted-foreground">{form.description}</p>
        )}
      </div>
      <Separator />
      <div className="space-y-4">
        {form.fields?.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            {field.type === "text" && (
              <Input placeholder={field.placeholder} disabled />
            )}
            {field.type === "email" && (
              <Input type="email" placeholder={field.placeholder} disabled />
            )}
            {field.type === "number" && (
              <Input type="number" placeholder={field.placeholder} disabled />
            )}
            {field.type === "date" && <Input type="date" disabled />}
            {field.type === "select" && (
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option, i) => (
                    <SelectItem key={i} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {field.type === "checkbox" && (
              <div className="flex items-center gap-2">
                <Checkbox disabled />
                <span className="text-sm">{field.placeholder || "Checkbox option"}</span>
              </div>
            )}
            {field.type === "radio" && (
              <div className="space-y-2">
                {field.options?.map((option, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" disabled />
                    <span className="text-sm">{option}</span>
                  </div>
                ))}
              </div>
            )}
            {field.type === "textarea" && (
              <Textarea placeholder={field.placeholder} disabled />
            )}
          </div>
        ))}
        {(!form.fields || form.fields.length === 0) && (
          <p className="text-center text-muted-foreground py-8">
            No fields added yet. Add fields from the builder to see the preview.
          </p>
        )}
      </div>
      {form.fields && form.fields.length > 0 && (
        <Button className="w-full" disabled>
          Submit
        </Button>
      )}
    </div>
  );
}

export default function FormsPage() {
  // State
  const [forms, setForms] = useState<FormData[]>([
    {
      id: "1",
      title: "Customer Feedback Form",
      description: "Help us improve our services",
      fields: [
        { id: "1", type: "text", label: "Name", required: true },
        { id: "2", type: "email", label: "Email", required: true },
        {
          id: "3",
          type: "select",
          label: "Rating",
          required: true,
          options: ["Excellent", "Good", "Fair", "Poor"],
        },
        { id: "4", type: "textarea", label: "Comments", required: false },
      ],
      published: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      submissions: 24,
    },
  ]);

  const [submissions, setSubmissions] = useState<FormSubmission[]>([
    {
      id: "1",
      formId: "1",
      data: {
        Name: "John Doe",
        Email: "john@example.com",
        Rating: "Excellent",
        Comments: "Great service!",
      },
      submittedAt: new Date(Date.now() - 1000 * 60 * 30),
    },
  ]);

  const [currentForm, setCurrentForm] = useState<Partial<FormData>>({
    title: "",
    description: "",
    redirectUrl: "",
    fields: [],
  });

  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"builder" | "forms">("builder");

  // Forms
  const settingsForm = useForm<FormSettingsInput>({
    resolver: zodResolver(formSettingsSchema),
    defaultValues: {
      title: currentForm.title || "",
      description: currentForm.description || "",
      redirectUrl: currentForm.redirectUrl || "",
    },
  });

  const fieldForm = useForm<FieldInput>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      label: "",
      placeholder: "",
      required: false,
      options: "",
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fields = currentForm.fields || [];
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      setCurrentForm({
        ...currentForm,
        fields: arrayMove(fields, oldIndex, newIndex),
      });
    }
  };

  const addField = (type: FormField["type"]) => {
    const newField: FormField = {
      id: nanoid(),
      type,
      label: `New ${type} field`,
      required: false,
    };
    setEditingField(newField);
    fieldForm.reset({
      label: newField.label,
      placeholder: "",
      required: false,
      options: "",
    });
    setShowFieldDialog(true);
  };

  const saveField = (data: FieldInput) => {
    if (!editingField) return;

    const field: FormField = {
      ...editingField,
      label: data.label,
      placeholder: data.placeholder,
      required: data.required,
      options:
        editingField.type === "select" || editingField.type === "radio"
          ? data.options?.split(",").map((o) => o.trim()).filter(Boolean)
          : undefined,
    };

    const fields = currentForm.fields || [];
    const existingIndex = fields.findIndex((f) => f.id === field.id);

    if (existingIndex >= 0) {
      fields[existingIndex] = field;
    } else {
      fields.push(field);
    }

    setCurrentForm({ ...currentForm, fields });
    setShowFieldDialog(false);
    setEditingField(null);
    fieldForm.reset();
  };

  const editField = (field: FormField) => {
    setEditingField(field);
    fieldForm.reset({
      label: field.label,
      placeholder: field.placeholder || "",
      required: field.required,
      options: field.options?.join(", ") || "",
    });
    setShowFieldDialog(true);
  };

  const deleteField = (id: string) => {
    setCurrentForm({
      ...currentForm,
      fields: currentForm.fields?.filter((f) => f.id !== id),
    });
  };

  const saveForm = (data: FormSettingsInput) => {
    const form: FormData = {
      id: nanoid(),
      title: data.title,
      description: data.description || "",
      redirectUrl: data.redirectUrl || "",
      fields: currentForm.fields || [],
      published: false,
      createdAt: new Date(),
      submissions: 0,
    };

    setForms([...forms, form]);
    setCurrentForm({ title: "", description: "", redirectUrl: "", fields: [] });
    settingsForm.reset();
    setActiveTab("forms");
  };

  const togglePublished = (id: string) => {
    setForms(forms.map((f) => (f.id === id ? { ...f, published: !f.published } : f)));
  };

  const deleteForm = (id: string) => {
    setForms(forms.filter((f) => f.id !== id));
  };

  const viewSubmissions = (id: string) => {
    setSelectedFormId(id);
    setShowSubmissions(true);
  };

  const exportToCSV = () => {
    if (!selectedFormId) return;

    const formSubmissions = submissions.filter((s) => s.formId === selectedFormId);
    if (formSubmissions.length === 0) return;

    // Get all field names
    const fields = Object.keys(formSubmissions[0].data);
    const csv = [
      ["Submitted At", ...fields].join(","),
      ...formSubmissions.map((s) =>
        [s.submittedAt.toISOString(), ...fields.map((f) => s.data[f] || "")].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-responses-${selectedFormId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyShareLink = (id: string) => {
    const url = `${window.location.origin}/forms/${id}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-7xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Form Builder</h1>
            <p className="text-muted-foreground">
              Create and manage custom forms with drag & drop
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="forms">Published Forms</TabsTrigger>
          </TabsList>

          {/* Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left: Builder */}
              <div className="space-y-6">
                {/* Form Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Form Settings</CardTitle>
                    <CardDescription>Configure your form details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Form Title *</Label>
                      <Input
                        id="title"
                        {...settingsForm.register("title")}
                        placeholder="e.g., Contact Form"
                      />
                      {settingsForm.formState.errors.title && (
                        <p className="text-sm text-destructive">
                          {settingsForm.formState.errors.title.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        {...settingsForm.register("description")}
                        placeholder="Brief description of your form"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="redirectUrl">Redirect URL (after submit)</Label>
                      <Input
                        id="redirectUrl"
                        {...settingsForm.register("redirectUrl")}
                        placeholder="https://example.com/thank-you"
                      />
                      {settingsForm.formState.errors.redirectUrl && (
                        <p className="text-sm text-destructive">
                          {settingsForm.formState.errors.redirectUrl.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Field Types */}
                <Card>
                  <CardHeader>
                    <CardTitle>Add Field</CardTitle>
                    <CardDescription>Click to add a field to your form</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {fieldTypes.map((ft) => (
                        <Button
                          key={ft.type}
                          variant="outline"
                          className="justify-start"
                          onClick={() => addField(ft.type)}
                        >
                          <ft.icon className="mr-2 h-4 w-4" />
                          {ft.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Fields List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Form Fields</CardTitle>
                    <CardDescription>Drag to reorder fields</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentForm.fields && currentForm.fields.length > 0 ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={currentForm.fields.map((f) => f.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {currentForm.fields.map((field) => (
                              <SortableField
                                key={field.id}
                                field={field}
                                onEdit={() => editField(field)}
                                onDelete={() => deleteField(field.id)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No fields added yet. Add fields from above.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={settingsForm.handleSubmit(saveForm)}
                    disabled={!currentForm.fields || currentForm.fields.length === 0}
                    className="flex-1"
                  >
                    Save Form
                  </Button>
                  <Button variant="outline" onClick={() => setShowPreview(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </div>

              {/* Right: Live Preview */}
              <div className="sticky top-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>See how your form will look</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                      <FormPreview
                        form={{
                          ...currentForm,
                          title: settingsForm.watch("title") || currentForm.title,
                          description:
                            settingsForm.watch("description") || currentForm.description,
                        }}
                      />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Published Forms Tab */}
          <TabsContent value="forms" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {forms.map((form) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="line-clamp-1">{form.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {form.description || "No description"}
                          </CardDescription>
                        </div>
                        <Badge variant={form.published ? "default" : "secondary"}>
                          {form.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Fields</p>
                          <p className="font-medium">{form.fields.length}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Responses</p>
                          <p className="font-medium">{form.submissions}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewSubmissions(form.id)}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          Responses
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyShareLink(form.id)}
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePublished(form.id)}
                        >
                          {form.published ? "Unpublish" : "Publish"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteForm(form.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {forms.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No forms yet</h3>
                  <p className="text-muted-foreground">
                    Create your first form using the builder
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setActiveTab("builder")}
                  >
                    Create Form
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Field Edit Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField && currentForm.fields?.some((f) => f.id === editingField.id)
                ? "Edit Field"
                : "Add Field"}
            </DialogTitle>
            <DialogDescription>
              Configure the field properties
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={fieldForm.handleSubmit(saveField)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-label">Label *</Label>
              <Input
                id="field-label"
                {...fieldForm.register("label")}
                placeholder="e.g., Full Name"
              />
              {fieldForm.formState.errors.label && (
                <p className="text-sm text-destructive">
                  {fieldForm.formState.errors.label.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                {...fieldForm.register("placeholder")}
                placeholder="e.g., Enter your name"
              />
            </div>
            {(editingField?.type === "select" || editingField?.type === "radio") && (
              <div className="space-y-2">
                <Label htmlFor="field-options">Options (comma-separated) *</Label>
                <Textarea
                  id="field-options"
                  {...fieldForm.register("options")}
                  placeholder="Option 1, Option 2, Option 3"
                  rows={3}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Controller
                name="required"
                control={fieldForm.control}
                render={({ field }) => (
                  <Checkbox
                    id="field-required"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="field-required" className="cursor-pointer">
                Required field
              </Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFieldDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Field</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={showSubmissions} onOpenChange={setShowSubmissions}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Form Responses</DialogTitle>
            <DialogDescription>
              {submissions.filter((s) => s.formId === selectedFormId).length} total responses
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {submissions
                .filter((s) => s.formId === selectedFormId)
                .map((submission) => (
                  <Card key={submission.id}>
                    <CardHeader>
                      <CardDescription>
                        Submitted {submission.submittedAt.toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(submission.data).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-3 gap-2">
                          <span className="font-medium">{key}:</span>
                          <span className="col-span-2 text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}

              {submissions.filter((s) => s.formId === selectedFormId).length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No responses yet
                </p>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setShowSubmissions(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
            <DialogDescription>This is how your form will appear to users</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <FormPreview form={currentForm} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
