import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2, Clock } from "lucide-react"

interface Version {
  id: string
  version_number: number
  created_at: string
  created_by?: {
    id: string
    name: string
    email: string
  }
  description?: string
}

interface VersionTableProps {
  versions: Version[]
  onDelete: (versionId: string) => void
  canDelete?: boolean
  currentVersion?: number
}

export function VersionTable({
  versions,
  onDelete,
  canDelete = false,
  currentVersion,
}: VersionTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version?')) return

    setDeletingId(versionId)
    try {
      await onDelete(versionId)
    } catch (error) {
      console.error('Failed to delete version:', error)
    } finally {
      setDeletingId(null)
    }
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Versions Found</h3>
        <p className="text-sm text-muted-foreground">
          Version history will appear here when new versions are created.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Version</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.map((version) => {
            const isCurrent = currentVersion === version.version_number

            return (
              <TableRow
                key={version.id}
                className={isCurrent ? "bg-muted/50" : ""}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isCurrent ? "default" : "outline"}
                      className="font-mono"
                    >
                      v{version.version_number}
                    </Badge>
                    {isCurrent && (
                      <span className="text-xs text-muted-foreground font-medium">
                        Current
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {version.created_by?.name || 'Unknown'}
                    </span>
                    {version.created_by?.email && (
                      <span className="text-xs text-muted-foreground">
                        {version.created_by.email}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(version.created_at)}
                </TableCell>
                <TableCell className="max-w-xs">
                  <span className="text-sm text-muted-foreground truncate block">
                    {version.description || 'No description'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => handleDelete(version.id)}
                          disabled={deletingId === version.id}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deletingId === version.id ? 'Deleting...' : 'Delete'}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
