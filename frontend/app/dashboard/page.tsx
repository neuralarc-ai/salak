"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Upload, FolderTree, Users, Loader2 } from "lucide-react"
import { api } from "@/lib/api-client"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalCategories: 0,
    recentDocuments: [] as any[],
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch documents and categories in parallel
      const [documentsRes, categoriesRes] = await Promise.all([
        api.get('/documents?limit=5'),
        api.get('/categories'),
      ])

      if (documentsRes.success) {
        setStats(prev => ({
          ...prev,
          totalDocuments: documentsRes.pagination?.total || 0,
          recentDocuments: documentsRes.documents || [],
        }))
      }

      if (categoriesRes.success) {
        setStats(prev => ({
          ...prev,
          totalCategories: categoriesRes.total || 0,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const statsCards = [
    {
      title: "Total Documents",
      value: stats.totalDocuments.toLocaleString(),
      description: "All documents in system",
      icon: FileText,
    },
    {
      title: "Categories",
      value: stats.totalCategories.toString(),
      description: "Active categories",
      icon: FolderTree,
    },
  ]

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your documents and resources.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>
                Your recently uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentDocuments.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentDocuments.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 hover:bg-muted/50 p-2 rounded transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No documents yet. Upload your first document!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link
                  href="/upload"
                  className="block w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium">Upload New Document</p>
                  <p className="text-xs text-muted-foreground">
                    Add a new file to the system
                  </p>
                </Link>
                <Link
                  href="/categories"
                  className="block w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium">Browse Categories</p>
                  <p className="text-xs text-muted-foreground">
                    Explore document categories
                  </p>
                </Link>
                <Link
                  href="/documents"
                  className="block w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium">Search Documents</p>
                  <p className="text-xs text-muted-foreground">
                    Find specific files quickly
                  </p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  )
}

