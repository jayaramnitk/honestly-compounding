import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil } from "lucide-react";
import { useThemes } from "@/hooks/use-themes-api";
import { CreateThemeDialog } from "@/components/CreateThemeDialog";
import { SidePanel } from "@/components/SidePanel";
import type { Theme } from "@/lib/api-client";

// Helper function to strip HTML tags from text
const stripHtml = (html: string) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function Themes() {
  const { userRole } = useAuth();
  const { data, isLoading } = useThemes();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);

  const isAdmin = userRole === "admin";

  const handleViewTheme = (theme: any) => {
    setSelectedTheme({
      id: theme.id,
      name: theme.name,
      description: theme.description || "No description available.",
    });
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setCreateDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setEditingTheme(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  const themes = data?.themes || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Themes</h1>
          <p className="text-gray-500">
            Browse and manage investment themes
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Theme
          </Button>
        )}
      </div>

      {/* Themes List */}
      <Card>
        <CardContent>
          {themes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No themes available yet.
              {isAdmin && " Click 'Create Theme' to add one."}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {themes.map((theme) => (
                <Card
                  key={theme.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{theme.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {stripHtml(theme.description).substring(0, 150)}
                      {stripHtml(theme.description).length > 150 ? "..." : ""}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Created by{" "}
                        {theme.creator?.fullName || "Unknown"}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTheme(theme)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTheme(theme)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side Panel for Theme Details */}
      <SidePanel
        open={!!selectedTheme}
        onClose={() => setSelectedTheme(null)}
        title={selectedTheme ? `Theme: ${selectedTheme.name}` : ""}
      >
        {selectedTheme && (
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedTheme.description }}
          />
        )}
      </SidePanel>

      {/* Create/Edit Dialog */}
      <CreateThemeDialog
        open={createDialogOpen}
        onOpenChange={handleDialogClose}
        theme={editingTheme}
      />
    </div>
  );
}
