import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building, Plus, FileText, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useStocks, useDeleteStock } from "@/hooks/use-stocks-api";
import { CreateStockDialog } from "@/components/CreateStockDialog";
import { EditStockDialog } from "@/components/EditStockDialog";
import { SidePanel } from "@/components/SidePanel";
import { SecurePDFViewer } from "@/components/SecurePDFViewer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ReactMarkdown from "react-markdown";
import type { Stock } from "@/lib/api-client";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

type SidePanelView =
  | { type: "theme"; theme: { id: string; name: string; description: string } }
  | { type: "bucket"; bucket: { id: string; name: string; description: string } }
  | null;

export default function Stocks() {
  const { userRole } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingStock, setDeletingStock] = useState<Stock | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [sidePanelView, setSidePanelView] = useState<SidePanelView>(null);
  const [sidePanelLoading, setSidePanelLoading] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<{
    fileName: string;
    title: string;
  } | null>(null);

  const { data, isLoading, error } = useStocks(currentPage, pageSize);
  const deleteStock = useDeleteStock();

  const handleViewTheme = async (stock: Stock) => {
    if (stock.theme) {
      setSidePanelLoading(true);
      try {
        const theme = await apiClient.getTheme(stock.theme.id);
        setSidePanelView({
          type: "theme",
          theme: {
            id: theme.id,
            name: theme.name,
            description: theme.description || "No description available.",
          },
        });
      } catch (error) {
        toast.error("Failed to load theme details");
        console.error(error);
      } finally {
        setSidePanelLoading(false);
      }
    }
  };

  const handleViewBucket = async (stock: Stock) => {
    if (stock.bucket) {
      setSidePanelLoading(true);
      try {
        const bucket = await apiClient.getBucket(stock.bucket.id);
        setSidePanelView({
          type: "bucket",
          bucket: {
            id: bucket.id,
            name: bucket.name,
            description: bucket.description || "No description available.",
          },
        });
      } catch (error) {
        toast.error("Failed to load bucket details");
        console.error(error);
      } finally {
        setSidePanelLoading(false);
      }
    }
  };

  const handleViewPDF = (stock: Stock) => {
    if (stock.pdfUrl) {
      setSelectedPDF({
        fileName: stock.pdfUrl,
        title: `${stock.symbol} - ${stock.companyName}`,
      });
    }
  };

  const handleCloseSidePanel = () => {
    setSidePanelView(null);
    setSidePanelLoading(false);
  };

  const handleClosePDF = () => {
    setSelectedPDF(null);
  };

  const handleEditStock = (stock: Stock) => {
    setEditingStock(stock);
    setEditDialogOpen(true);
  };

  const handleDeleteStock = (stock: Stock) => {
    setDeletingStock(stock);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingStock) {
      await deleteStock.mutateAsync(deletingStock.id);
      setDeleteDialogOpen(false);
      setDeletingStock(null);
    }
  };

  const canAddStocks = userRole === "admin";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading stocks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-destructive">
          Error loading stocks: {error.message}
        </div>
      </div>
    );
  }

  const stocks = data?.stocks || [];
  const totalStocks = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const getSidePanelTitle = () => {
    if (sidePanelView?.type === "theme") {
      return `Theme: ${sidePanelView.theme.name}`;
    }
    if (sidePanelView?.type === "bucket") {
      return `Bucket: ${sidePanelView.bucket.name}`;
    }
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Research</h1>
          <p className="text-muted-foreground">
            Individual stock analysis and research reports
          </p>
        </div>
        {canAddStocks && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Stock
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          {stocks.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg mb-2">
                No stocks found
              </p>
              {canAddStocks && (
                <p className="text-sm text-muted-foreground">
                  Click "Add Stock" to create your first stock entry
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stock Name</TableHead>
                      <TableHead>Stock Symbol</TableHead>
                      <TableHead>Associated Theme</TableHead>
                      <TableHead>Associated Bucket</TableHead>
                      <TableHead>Stock Note</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.map((stock) => (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">
                          {stock.companyName}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-semibold">
                            {stock.symbol}
                          </span>
                        </TableCell>
                        <TableCell>
                          {stock.theme ? (
                            <Button
                              variant="link"
                              className="p-0 h-auto font-normal"
                              onClick={() => handleViewTheme(stock)}
                            >
                              {stock.theme.name}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {stock.bucket ? (
                            <Button
                              variant="link"
                              className="p-0 h-auto font-normal"
                              onClick={() => handleViewBucket(stock)}
                            >
                              {stock.bucket.name}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {stock.pdfUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPDF(stock)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View PDF
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No PDF
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canAddStocks && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditStock(stock)}
                                  title="Edit stock"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteStock(stock)}
                                  title="Delete stock"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing page {currentPage} of {totalPages} ({totalStocks}{" "}
                    total stocks)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Stock Dialog */}
      <CreateStockDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Stock Dialog */}
      {editingStock && (
        <EditStockDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          stock={editingStock}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stock</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingStock?.symbol} -{" "}
              {deletingStock?.companyName}? This action cannot be undone and
              will also delete the associated PDF if present.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Side Panel for Theme/Bucket */}
      <SidePanel
        open={!!sidePanelView || sidePanelLoading}
        onClose={handleCloseSidePanel}
        title={getSidePanelTitle()}
      >
        {sidePanelLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            {sidePanelView?.type === "theme" && (
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{sidePanelView.theme.description}</ReactMarkdown>
              </div>
            )}
            {sidePanelView?.type === "bucket" && (
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{sidePanelView.bucket.description}</ReactMarkdown>
              </div>
            )}
          </>
        )}
      </SidePanel>

      {/* PDF Viewer */}
      <SecurePDFViewer
        isOpen={!!selectedPDF}
        onClose={handleClosePDF}
        fileName={selectedPDF?.fileName}
        title={selectedPDF?.title || ""}
      />
    </div>
  );
}