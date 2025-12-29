"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FileText,
  Share2,
  Calendar,
  User,
  FolderTree,
  Tag,
  Loader2,
  Copy,
  Check,
  Info,
  Activity,
} from "lucide-react"
import { VersionTable } from "@/components/VersionTable"
import { api } from "@/lib/api-client"
import { useAuth } from "@/components/auth-context"

export default function DocumentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [document, setDocument] = useState<any>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [shareDialog, setShareDialog] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [shareInfo, setShareInfo] = useState<{ expiresIn?: string; documentName?: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const id = params.id as string

  useEffect(() => {
    fetchDocument()
    fetchVersions()
  }, [id])

  const fetchDocument = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/documents/${id}`)
      if (response.success) {
        setDocument(response.document)
      } else {
        router.push('/documents')
      }
    } catch (error) {
      console.error('Failed to fetch document:', error)
      router.push('/documents')
    } finally {
      setLoading(false)
    }
  }

  const fetchVersions = async () => {
    try {
      const response = await api.get(`/documents/${id}/versions`)
      if (response.success) {
        setVersions(response.versions || [])
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      // This would typically fetch from an audit log API
      // For now, we'll simulate with some sample logs
      const logs = [
        {
          id: '1',
          action: 'Document Created',
          user: document?.uploader?.name || 'Unknown',
          timestamp: document?.created_at,
          details: 'Initial document upload'
        },
        {
          id: '2',
          action: 'Document Viewed',
          user: user?.name || 'Current User',
          timestamp: new Date().toISOString(),
          details: 'Document accessed'
        }
      ]
      setAuditLogs(logs)
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    }
  }

  const handleShare = async () => {
    try {
      const response = await api.get(`/documents/${id}/share`)

      if (response.success && response.shareUrl) {
        setShareLink(response.shareUrl)
        setShareInfo({
          expiresIn: response.expiresIn,
          documentName: response.documentName,
        })
        setShareDialog(true)
      } else {
        alert(response.error || 'Failed to generate share link')
      }
    } catch (error) {
      console.error('Share error:', error)
      alert('Failed to generate share link')
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      const textArea = document.createElement('textarea')
      textArea.value = shareLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }


  const handleVersionDownload = async (versionId: string) => {
    // In a real implementation, this would download the specific version
    console.log('Downloading version:', versionId)
    // Download functionality has been removed
    alert('Download functionality is currently disabled')
  }

  const handleVersionDelete = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version?')) return

    try {
      // This would typically call a version delete API
      // For now, we'll just refresh the versions
      await fetchVersions()
      alert('Version deleted successfully')
    } catch (error) {
      console.error('Failed to delete version:', error)
      alert('Failed to delete version')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const isAdmin = user?.role === 'admin'
  const isOwner = user?.id === document?.uploaded_by

  const canDeleteVersions = isAdmin || isOwner

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </LayoutWrapper>
    )
  }

  if (!document) {
    return (
      <LayoutWrapper>
        <div className="p-8">
          <p>Document not found</p>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold truncate">{document.name}</h1>
                  <p className="text-muted-foreground">Document Details & Management</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant={document.status === "active" ? "default" : "secondary"}>
                  {document.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(document.file_size)}
                </span>
                <span className="text-sm text-muted-foreground">
                  Version {document.version}
                </span>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Document Info Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FolderTree className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm font-medium truncate">
                    {document.categories?.name || 'Uncategorized'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="text-sm font-medium truncate">
                    {document.uploader?.name || 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {new Date(document.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Tags</p>
                  <p className="text-sm font-medium">
                    {document.tags?.length || 0} tags
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            {isAdmin && <TabsTrigger value="audit">Audit Log</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-6">
                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {document.description || 'No description provided for this document.'}
                    </p>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      Document preview and content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {document.file_type === "application/pdf" ? (
                      <iframe
                        src={`/api/documents/${document.id}/view`}
                        width="100%"
                        height="500px"
                        style={{ border: 'none' }}
                        title="Document Preview"
                      />
                    ) : (
                      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                        <div className="text-center">
                          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Document preview not available
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Download the file to view its contents
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {document.tags && document.tags.length > 0 ? (
                        document.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No tags assigned</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* File Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>File Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">File Type</span>
                      <span className="text-sm font-medium">{document.file_type || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">File Size</span>
                      <span className="text-sm font-medium">{formatFileSize(document.file_size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Version</span>
                      <span className="text-sm font-medium">{document.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={document.status === "active" ? "default" : "secondary"}>
                        {document.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
                <CardDescription>
                  All versions of this document with download and management options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VersionTable
                  versions={versions}
                  onDelete={handleVersionDelete}
                  canDelete={canDeleteVersions}
                  currentVersion={document.version}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Document Metadata
                </CardTitle>
                <CardDescription>
                  Complete technical and organizational information about this document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      File Properties
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">File Name</span>
                        <span className="text-sm font-medium">{document.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">File Type</span>
                        <span className="text-sm font-medium">{document.file_type || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">File Size</span>
                        <span className="text-sm font-medium">{formatFileSize(document.file_size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">File Path</span>
                        <span className="text-sm font-medium font-mono text-xs">
                          {document.file_path}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Document Properties
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Document ID</span>
                        <span className="text-sm font-medium font-mono">{document.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Version</span>
                        <span className="text-sm font-medium">{document.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Status</span>
                        <Badge variant={document.status === "active" ? "default" : "secondary"}>
                          {document.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Category</span>
                        <span className="text-sm font-medium">
                          {document.categories?.name || 'Uncategorized'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Ownership & Permissions
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Owner</span>
                      <span className="text-sm font-medium">{document.uploader?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Owner Email</span>
                      <span className="text-sm font-medium">{document.uploader?.email || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Timestamps
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Created</span>
                      <span className="text-sm font-medium">{formatDate(document.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Last Updated</span>
                      <span className="text-sm font-medium">{formatDate(document.updated_at)}</span>
                    </div>
                  </div>
                </div>

                {document.tags && document.tags.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {document.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="audit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Audit Log
                  </CardTitle>
                  <CardDescription>
                    Complete activity history for this document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length > 0 ? auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell>{log.user}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.details}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.ip_address || 'N/A'}
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No audit logs available for this document
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Share Document Dialog */}
        <Dialog open={shareDialog} onOpenChange={setShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Document</DialogTitle>
              <DialogDescription>
                Copy the link below to share this document with others.
                {shareInfo?.expiresIn && (
                  <span className="block mt-1 text-amber-600">
                    Link expires in {shareInfo.expiresIn}.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="share-link">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-link"
                    value={shareLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={copyToClipboard} variant="outline">
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-sm text-green-600">Link copied to clipboard!</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShareDialog(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  )
}

