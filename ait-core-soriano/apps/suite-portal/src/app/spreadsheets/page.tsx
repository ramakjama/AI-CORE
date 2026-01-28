"use client";

import { useState, useRef, useEffect } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";
import "./spreadsheet-theme.css";
import { registerAllModules } from "handsontable/registry";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { spreadsheetsApi } from "@/lib/api";
import {
  Plus,
  Download,
  Share2,
  Save,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Percent,
  DollarSign,
  Calendar,
  Hash,
  ChevronDown,
  Users,
  FileSpreadsheet,
  Clock,
  Trash2,
  Copy,
  FileDown,
  X,
  Grid,
  Freeze,
  Merge,
  SortAsc,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Register Handsontable modules
registerAllModules();

interface Spreadsheet {
  id: string;
  title: string;
  sheets: Sheet[];
  created_at: string;
  updated_at: string;
  shared_with: string[];
  owner: string;
}

interface Sheet {
  id: string;
  name: string;
  data: any[][];
  meta?: any;
  frozen_rows?: number;
  frozen_columns?: number;
}

interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  align?: "left" | "center" | "right";
  fontSize?: number;
}

export default function SpreadsheetsPage() {
  const hotRef = useRef<HotTable>(null);
  const queryClient = useQueryClient();

  // State
  const [currentSpreadsheetId, setCurrentSpreadsheetId] = useState<string | null>(null);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [spreadsheetTitle, setSpreadsheetTitle] = useState("Untitled Spreadsheet");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [sheets, setSheets] = useState<Sheet[]>([
    {
      id: "sheet-1",
      name: "Sheet 1",
      data: Array(100)
        .fill(null)
        .map(() => Array(26).fill(null)),
    },
  ]);
  const [selectedCells, setSelectedCells] = useState<any>(null);
  const [cellStyles, setCellStyles] = useState<Map<string, CellStyle>>(new Map());
  const [collaborators, setCollaborators] = useState<any[]>([]);

  // Fetch spreadsheets list
  const { data: spreadsheets, isLoading } = useQuery({
    queryKey: ["spreadsheets"],
    queryFn: async () => {
      const response = await spreadsheetsApi.get<Spreadsheet[]>("/");
      return response;
    },
  });

  // Fetch spreadsheet by ID
  const { data: currentSpreadsheet } = useQuery({
    queryKey: ["spreadsheet", currentSpreadsheetId],
    queryFn: async () => {
      if (!currentSpreadsheetId) return null;
      const response = await spreadsheetsApi.get<Spreadsheet>(`/${currentSpreadsheetId}`);
      return response;
    },
    enabled: !!currentSpreadsheetId,
  });

  // Create spreadsheet mutation
  const createSpreadsheetMutation = useMutation({
    mutationFn: async (data: { title: string }) => {
      return await spreadsheetsApi.post<Spreadsheet>("/", {
        title: data.title,
        sheets: [
          {
            id: "sheet-1",
            name: "Sheet 1",
            data: Array(100)
              .fill(null)
              .map(() => Array(26).fill(null)),
          },
        ],
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["spreadsheets"] });
      setCurrentSpreadsheetId(data.id);
      setSpreadsheetTitle(data.title);
      setSheets(data.sheets);
    },
  });

  // Save spreadsheet mutation
  const saveSpreadsheetMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; sheets: Sheet[] }) => {
      return await spreadsheetsApi.put(`/${data.id}`, {
        title: data.title,
        sheets: data.sheets,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spreadsheets"] });
    },
  });

  // Delete spreadsheet mutation
  const deleteSpreadsheetMutation = useMutation({
    mutationFn: async (id: string) => {
      return await spreadsheetsApi.delete(`/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spreadsheets"] });
      if (currentSpreadsheetId === currentSpreadsheetId) {
        setCurrentSpreadsheetId(null);
        setSpreadsheetTitle("Untitled Spreadsheet");
      }
    },
  });

  // Load spreadsheet data when selected
  useEffect(() => {
    if (currentSpreadsheet) {
      setSpreadsheetTitle(currentSpreadsheet.title);
      setSheets(currentSpreadsheet.sheets);
      setCollaborators(currentSpreadsheet.shared_with || []);
    }
  }, [currentSpreadsheet]);

  // Handsontable settings
  const hotSettings: Handsontable.GridSettings = {
    data: sheets[currentSheetIndex]?.data || [],
    colHeaders: true,
    rowHeaders: true,
    contextMenu: true,
    manualColumnResize: true,
    manualRowResize: true,
    manualColumnMove: true,
    manualRowMove: true,
    autoWrapRow: true,
    autoWrapCol: true,
    copyPaste: true,
    fillHandle: true,
    mergeCells: true,
    filters: true,
    dropdownMenu: true,
    columnSorting: true,
    formulas: {
      engine: Handsontable.plugins.Formulas,
    },
    licenseKey: "non-commercial-and-evaluation",
    height: "calc(100vh - 240px)",
    width: "100%",
    stretchH: "all",
    afterChange: (changes) => {
      if (changes) {
        handleDataChange();
      }
    },
    afterSelection: (row, column, row2, column2) => {
      setSelectedCells({ row, column, row2, column2 });
    },
  };

  // Handlers
  const handleDataChange = () => {
    if (hotRef.current?.hotInstance) {
      const newData = hotRef.current.hotInstance.getData();
      const updatedSheets = [...sheets];
      updatedSheets[currentSheetIndex].data = newData;
      setSheets(updatedSheets);
    }
  };

  const handleSave = () => {
    if (currentSpreadsheetId) {
      saveSpreadsheetMutation.mutate({
        id: currentSpreadsheetId,
        title: spreadsheetTitle,
        sheets: sheets,
      });
    } else {
      createSpreadsheetMutation.mutate({
        title: spreadsheetTitle,
      });
    }
  };

  const handleCreateNew = () => {
    setCurrentSpreadsheetId(null);
    setSpreadsheetTitle("Untitled Spreadsheet");
    setSheets([
      {
        id: `sheet-${Date.now()}`,
        name: "Sheet 1",
        data: Array(100)
          .fill(null)
          .map(() => Array(26).fill(null)),
      },
    ]);
    setCurrentSheetIndex(0);
  };

  const handleAddSheet = () => {
    const newSheet: Sheet = {
      id: `sheet-${Date.now()}`,
      name: `Sheet ${sheets.length + 1}`,
      data: Array(100)
        .fill(null)
        .map(() => Array(26).fill(null)),
    };
    setSheets([...sheets, newSheet]);
    setCurrentSheetIndex(sheets.length);
  };

  const handleDeleteSheet = (index: number) => {
    if (sheets.length > 1) {
      const newSheets = sheets.filter((_, i) => i !== index);
      setSheets(newSheets);
      setCurrentSheetIndex(Math.max(0, currentSheetIndex - 1));
    }
  };

  const handleRenameSheet = (index: number, newName: string) => {
    const newSheets = [...sheets];
    newSheets[index].name = newName;
    setSheets(newSheets);
  };

  const handleFormatBold = () => {
    if (selectedCells && hotRef.current?.hotInstance) {
      const hot = hotRef.current.hotInstance;
      const { row, column, row2, column2 } = selectedCells;

      for (let r = Math.min(row, row2); r <= Math.max(row, row2); r++) {
        for (let c = Math.min(column, column2); c <= Math.max(column, column2); c++) {
          const cellKey = `${r}-${c}`;
          const currentStyle = cellStyles.get(cellKey) || {};
          const newStyle = { ...currentStyle, bold: !currentStyle.bold };
          setCellStyles(new Map(cellStyles.set(cellKey, newStyle)));

          hot.setCellMeta(r, c, "className", getCellClassName(newStyle));
        }
      }
      hot.render();
    }
  };

  const handleFormatItalic = () => {
    if (selectedCells && hotRef.current?.hotInstance) {
      const hot = hotRef.current.hotInstance;
      const { row, column, row2, column2 } = selectedCells;

      for (let r = Math.min(row, row2); r <= Math.max(row, row2); r++) {
        for (let c = Math.min(column, column2); c <= Math.max(column, column2); c++) {
          const cellKey = `${r}-${c}`;
          const currentStyle = cellStyles.get(cellKey) || {};
          const newStyle = { ...currentStyle, italic: !currentStyle.italic };
          setCellStyles(new Map(cellStyles.set(cellKey, newStyle)));

          hot.setCellMeta(r, c, "className", getCellClassName(newStyle));
        }
      }
      hot.render();
    }
  };

  const handleFormatColor = (color: string) => {
    if (selectedCells && hotRef.current?.hotInstance) {
      const hot = hotRef.current.hotInstance;
      const { row, column, row2, column2 } = selectedCells;

      for (let r = Math.min(row, row2); r <= Math.max(row, row2); r++) {
        for (let c = Math.min(column, column2); c <= Math.max(column, column2); c++) {
          const cellKey = `${r}-${c}`;
          const currentStyle = cellStyles.get(cellKey) || {};
          const newStyle = { ...currentStyle, color };
          setCellStyles(new Map(cellStyles.set(cellKey, newStyle)));

          hot.setCellMeta(r, c, "className", getCellClassName(newStyle));
        }
      }
      hot.render();
    }
  };

  const handleFormatBackgroundColor = (backgroundColor: string) => {
    if (selectedCells && hotRef.current?.hotInstance) {
      const hot = hotRef.current.hotInstance;
      const { row, column, row2, column2 } = selectedCells;

      for (let r = Math.min(row, row2); r <= Math.max(row, row2); r++) {
        for (let c = Math.min(column, column2); c <= Math.max(column, column2); c++) {
          const cellKey = `${r}-${c}`;
          const currentStyle = cellStyles.get(cellKey) || {};
          const newStyle = { ...currentStyle, backgroundColor };
          setCellStyles(new Map(cellStyles.set(cellKey, newStyle)));

          hot.setCellMeta(r, c, "className", getCellClassName(newStyle));
        }
      }
      hot.render();
    }
  };

  const handleAlign = (align: "left" | "center" | "right") => {
    if (selectedCells && hotRef.current?.hotInstance) {
      const hot = hotRef.current.hotInstance;
      const { row, column, row2, column2 } = selectedCells;

      for (let r = Math.min(row, row2); r <= Math.max(row, row2); r++) {
        for (let c = Math.min(column, column2); c <= Math.max(column, column2); c++) {
          const cellKey = `${r}-${c}`;
          const currentStyle = cellStyles.get(cellKey) || {};
          const newStyle = { ...currentStyle, align };
          setCellStyles(new Map(cellStyles.set(cellKey, newStyle)));

          hot.setCellMeta(r, c, "className", getCellClassName(newStyle));
        }
      }
      hot.render();
    }
  };

  const handleNumberFormat = (format: "currency" | "percentage" | "date" | "number") => {
    if (selectedCells && hotRef.current?.hotInstance) {
      const hot = hotRef.current.hotInstance;
      const { row, column, row2, column2 } = selectedCells;

      let numericFormat: any = {};

      switch (format) {
        case "currency":
          numericFormat = { pattern: "$0,0.00" };
          break;
        case "percentage":
          numericFormat = { pattern: "0.00%" };
          break;
        case "date":
          numericFormat = { pattern: "YYYY-MM-DD" };
          break;
        case "number":
          numericFormat = { pattern: "0,0.00" };
          break;
      }

      for (let r = Math.min(row, row2); r <= Math.max(row, row2); r++) {
        for (let c = Math.min(column, column2); c <= Math.max(column, column2); c++) {
          hot.setCellMeta(r, c, "numericFormat", numericFormat);
        }
      }
      hot.render();
    }
  };

  const handleInsertRow = () => {
    if (hotRef.current?.hotInstance && selectedCells) {
      const hot = hotRef.current.hotInstance;
      hot.alter("insert_row_above", selectedCells.row);
    }
  };

  const handleInsertColumn = () => {
    if (hotRef.current?.hotInstance && selectedCells) {
      const hot = hotRef.current.hotInstance;
      hot.alter("insert_col_start", selectedCells.column);
    }
  };

  const handleDeleteRow = () => {
    if (hotRef.current?.hotInstance && selectedCells) {
      const hot = hotRef.current.hotInstance;
      hot.alter("remove_row", selectedCells.row);
    }
  };

  const handleDeleteColumn = () => {
    if (hotRef.current?.hotInstance && selectedCells) {
      const hot = hotRef.current.hotInstance;
      hot.alter("remove_col", selectedCells.column);
    }
  };

  const handleUndo = () => {
    if (hotRef.current?.hotInstance) {
      hotRef.current.hotInstance.undo();
    }
  };

  const handleRedo = () => {
    if (hotRef.current?.hotInstance) {
      hotRef.current.hotInstance.redo();
    }
  };

  const handleExport = async (format: "xlsx" | "csv") => {
    if (!currentSpreadsheetId) return;

    try {
      const response = await spreadsheetsApi.get(
        `/${currentSpreadsheetId}/export?format=${format}`,
        { responseType: "blob" }
      );

      const blob = new Blob([response as any]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${spreadsheetTitle}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportDialogOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const getCellClassName = (style: CellStyle): string => {
    const classes: string[] = [];
    if (style.bold) classes.push("font-bold");
    if (style.italic) classes.push("italic");
    if (style.underline) classes.push("underline");
    if (style.align) classes.push(`text-${style.align}`);
    return classes.join(" ");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/40 flex flex-col">
        <div className="p-4 border-b">
          <Button onClick={handleCreateNew} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            New Spreadsheet
          </Button>
        </div>

        <Tabs defaultValue="recent" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4 grid w-[calc(100%-2rem)] grid-cols-2">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="all">All Files</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-4 space-y-2">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : spreadsheets && spreadsheets.length > 0 ? (
                  spreadsheets
                    .slice(0, 10)
                    .map((spreadsheet) => (
                      <button
                        key={spreadsheet.id}
                        type="button"
                        onClick={() => setCurrentSpreadsheetId(spreadsheet.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg hover:bg-accent transition-colors",
                          currentSpreadsheetId === spreadsheet.id && "bg-accent"
                        )}
                        aria-label={`Open spreadsheet ${spreadsheet.title}`}
                      >
                        <div className="flex items-start gap-2">
                          <FileSpreadsheet className="h-4 w-4 mt-0.5 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {spreadsheet.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(spreadsheet.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No spreadsheets yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-4 space-y-2">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : spreadsheets && spreadsheets.length > 0 ? (
                  spreadsheets.map((spreadsheet) => (
                    <div
                      key={spreadsheet.id}
                      className="group relative"
                    >
                      <button
                        type="button"
                        onClick={() => setCurrentSpreadsheetId(spreadsheet.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg hover:bg-accent transition-colors",
                          currentSpreadsheetId === spreadsheet.id && "bg-accent"
                        )}
                        aria-label={`Open spreadsheet ${spreadsheet.title}`}
                      >
                        <div className="flex items-start gap-2">
                          <FileSpreadsheet className="h-4 w-4 mt-0.5 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {spreadsheet.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(spreadsheet.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-7 w-7"
                        onClick={() => deleteSpreadsheetMutation.mutate(spreadsheet.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No spreadsheets yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 border-b bg-background px-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            {isEditingTitle ? (
              <Input
                value={spreadsheetTitle}
                onChange={(e) => setSpreadsheetTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingTitle(false);
                }}
                className="max-w-md"
                autoFocus
                aria-label="Edit spreadsheet title"
              />
            ) : (
              <h1
                className="text-xl font-semibold cursor-pointer hover:bg-accent px-2 py-1 rounded"
                onClick={() => setIsEditingTitle(true)}
              >
                {spreadsheetTitle}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {collaborators.length > 0 && (
              <div className="flex items-center gap-2 mr-4">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{collaborators.length} online</Badge>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={() => setShareDialogOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setExportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button onClick={handleSave} size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b bg-muted/40 px-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleUndo}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleRedo}>
                <Redo className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Font Formatting */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleFormatBold}>
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleFormatItalic}>
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (selectedCells && hotRef.current?.hotInstance) {
                    const hot = hotRef.current.hotInstance;
                    const { row, column, row2, column2 } = selectedCells;
                    for (let r = Math.min(row, row2); r <= Math.max(row, row2); r++) {
                      for (let c = Math.min(column, column2); c <= Math.max(column, column2); c++) {
                        const cellKey = `${r}-${c}`;
                        const currentStyle = cellStyles.get(cellKey) || {};
                        const newStyle = { ...currentStyle, underline: !currentStyle.underline };
                        setCellStyles(new Map(cellStyles.set(cellKey, newStyle)));
                        hot.setCellMeta(r, c, "className", getCellClassName(newStyle));
                      }
                    }
                    hot.render();
                  }
                }}
              >
                <Underline className="h-4 w-4" />
              </Button>

              {/* Text Color */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <div className="flex flex-col items-center">
                      <span className="text-xs">A</span>
                      <div className="w-4 h-0.5 bg-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#FFC0CB"].map(
                      (color) => (
                        <button
                          key={color}
                          type="button"
                          className="w-6 h-6 rounded border hover:ring-2 ring-primary"
                          data-color={color}
                          onClick={() => handleFormatColor(color)}
                          aria-label={`Apply text color ${color}`}
                          title={`Apply text color ${color}`}
                        />
                      )
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Background Color */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <div className="flex flex-col items-center">
                      <Grid className="h-3 w-3" />
                      <div className="w-4 h-0.5 bg-yellow-400" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {["#FFFFFF", "#FFE6E6", "#E6FFE6", "#E6E6FF", "#FFFFE6", "#FFE6FF", "#E6FFFF", "#FFE6CC", "#E6CCFF", "#FFE6F0"].map(
                      (color) => (
                        <button
                          key={color}
                          type="button"
                          className="w-6 h-6 rounded border hover:ring-2 ring-primary"
                          data-color={color}
                          onClick={() => handleFormatBackgroundColor(color)}
                          aria-label={`Apply background color ${color}`}
                          title={`Apply background color ${color}`}
                        />
                      )
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Alignment */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => handleAlign("left")}>
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleAlign("center")}>
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleAlign("right")}>
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Number Formats */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNumberFormat("currency")}
              >
                <DollarSign className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNumberFormat("percentage")}
              >
                <Percent className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNumberFormat("date")}
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNumberFormat("number")}
              >
                <Hash className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Insert/Delete */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Insert
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleInsertRow}>Insert Row</DropdownMenuItem>
                <DropdownMenuItem onClick={handleInsertColumn}>Insert Column</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDeleteRow}>Delete Row</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteColumn}>Delete Column</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Spreadsheet */}
        <div className="flex-1 overflow-auto p-4">
          <div className="spreadsheet-container">
            <HotTable ref={hotRef} settings={hotSettings} />
          </div>
        </div>

        {/* Sheet Tabs */}
        <div className="border-t bg-muted/40 px-4 py-2 flex items-center gap-2">
          <ScrollArea className="flex-1">
            <div className="flex items-center gap-2">
              {sheets.map((sheet, index) => (
                <div
                  key={sheet.id}
                  className={cn(
                    "px-4 py-2 rounded-t-lg cursor-pointer hover:bg-accent transition-colors group relative",
                    currentSheetIndex === index && "bg-background border-t border-x"
                  )}
                  onClick={() => setCurrentSheetIndex(index)}
                >
                  <span className="text-sm font-medium">{sheet.name}</span>
                  {sheets.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSheet(index);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="icon" onClick={handleAddSheet}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Spreadsheet</DialogTitle>
            <DialogDescription>
              Share this spreadsheet with others to collaborate in real-time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Permission</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Can edit
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem>Can edit</DropdownMenuItem>
                  <DropdownMenuItem>Can view</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShareDialogOpen(false)}>Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Spreadsheet</DialogTitle>
            <DialogDescription>
              Choose a format to export your spreadsheet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport("xlsx")}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Microsoft Excel (.xlsx)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport("csv")}
            >
              <FileDown className="mr-2 h-4 w-4" />
              CSV (.csv)
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .handsontable {
          color: var(--foreground) !important;
          background: var(--background) !important;
        }

        .handsontable th {
          background: var(--muted) !important;
          color: var(--muted-foreground) !important;
          border-color: var(--border) !important;
        }

        .handsontable td {
          border-color: var(--border) !important;
          background: var(--background) !important;
          color: var(--foreground) !important;
        }

        .handsontable td.area {
          background-color: var(--accent) !important;
        }

        .handsontable td.current,
        .handsontable th.current {
          background-color: var(--accent) !important;
        }

        .handsontable .htContextMenu {
          background: var(--popover) !important;
          border-color: var(--border) !important;
          color: var(--popover-foreground) !important;
        }

        .handsontable .htContextMenu table tbody tr td {
          background: var(--popover) !important;
          color: var(--popover-foreground) !important;
          border-color: var(--border) !important;
        }

        .handsontable .htContextMenu table tbody tr td:hover {
          background: var(--accent) !important;
        }

        .handsontable .htDimmed {
          color: var(--muted-foreground) !important;
        }

        .handsontable .htFiltersMenuCheckbox {
          background: var(--background) !important;
          border-color: var(--border) !important;
        }

        .handsontable input {
          background: var(--background) !important;
          color: var(--foreground) !important;
          border-color: var(--border) !important;
        }

        .spreadsheet-container {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
