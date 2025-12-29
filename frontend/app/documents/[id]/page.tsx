"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Download,
  Share2,
  Calendar,
  User,
  FolderTree,
  Tag,
  Loader2,
} from "lucide-react"
import { api } from "@/lib/api-client"

interface DocumentDetailPageProps {
  params: {
    id: string
  }
}

export default function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [document, setDocument] = useState<any>(null)
  const [versions, setVersions] = useState<any[]>([])

  useEffect(() => {
    fetchDocument()
    fetchVersions()
  }, [params.id])

  const fetchDocument = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/documents/${params.id}`)
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
      const response = await api.get(`/documents/${params.id}/versions`)
      if (response.success) {
        setVersions(response.versions || [])
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
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
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{document.name}</h1>
            <p className="text-muted-foreground">Document Details</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Document preview area</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Document preview will appear here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {document.description || 'No description provided'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
                <CardDescription>Previous versions of this document</CardDescription>
              </CardHeader>
              <CardContent>
                {versions.length > 0 ? (
                  <div className="space-y-4">
                    {versions.map((version) => (
                      <div key={version.id} className="flex items-center justify-between border-b pb-3">
                        <div>
                          <p className="text-sm font-medium">Version {version.version_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(version.created_at)} by {version.created_by?.name || 'Unknown'}
                          </p>
                          {version.description && (
                            <p className="text-xs text-muted-foreground mt-1">{version.description}</p>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No previous versions</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <FolderTree className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="text-sm font-medium">{document.categories?.name || 'Uncategorized'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="text-sm font-medium">{formatFileSize(document.file_size)}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Uploaded By</p>
                    <p className="text-sm font-medium">{document.uploader?.name || 'Unknown'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Uploaded</p>
                    <p className="text-sm font-medium">{formatDate(document.created_at)}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="text-sm font-medium">{formatDate(document.updated_at)}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Status</p>
                  <Badge>{document.status}</Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {document.tags && document.tags.length > 0 ? (
                      document.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No tags</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}

