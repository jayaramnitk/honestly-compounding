import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Pencil } from "lucide-react";
import { useBuckets } from "@/hooks/use-buckets-api";
import { CreateBucketDialog } from "@/components/CreateBucketDialog";
import { SidePanel } from "@/components/SidePanel";
import type { Bucket } from "@/lib/api-client";

// Helper function to strip HTML tags from text
const stripHtml = (html: string) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function Buckets() {
  const { userRole } = useAuth();
  const { data, isLoading } = useBuckets();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<{
    id: string;
    name: string;
    description: string;
    riskMeasure: string;
  } | null>(null);

  const isAdmin = userRole === "admin";

  const handleViewBucket = (bucket: any) => {
    setSelectedBucket({
      id: bucket.id,
      name: bucket.name,
      description: bucket.description || "No description available.",
      riskMeasure: bucket.riskMeasure,
    });
  };

  const handleEditBucket = (bucket: Bucket) => {
    setEditingBucket(bucket);
    setCreateDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setEditingBucket(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  const buckets = data?.buckets || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Buckets</h1>
          <p className="text-gray-500">
            Browse and manage investment buckets
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Bucket
          </Button>
        )}
      </div>

      {/* Buckets List */}
      <Card>
        <CardContent>
          {buckets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No buckets available yet.
              {isAdmin && " Click 'Create Bucket' to add one."}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {buckets.map((bucket) => (
                <Card
                  key={bucket.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{bucket.name}</CardTitle>
                      <Badge variant="outline">{bucket.riskMeasure}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {stripHtml(bucket.description).substring(0, 150)}
                      {stripHtml(bucket.description).length > 150 ? "..." : ""}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Created by{" "}
                        {bucket.creator?.fullName || "Unknown"}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewBucket(bucket)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBucket(bucket)}
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

      {/* Side Panel for Bucket Details */}
      <SidePanel
        open={!!selectedBucket}
        onClose={() => setSelectedBucket(null)}
        title={selectedBucket ? `Bucket: ${selectedBucket.name}` : ""}
        description={
          selectedBucket ? `Risk Measure: ${selectedBucket.riskMeasure}` : ""
        }
      >
        {selectedBucket && (
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedBucket.description }}
          />
        )}
      </SidePanel>

      {/* Create/Edit Dialog */}
      <CreateBucketDialog
        open={createDialogOpen}
        onOpenChange={handleDialogClose}
        bucket={editingBucket}
      />
    </div>
  );
}
