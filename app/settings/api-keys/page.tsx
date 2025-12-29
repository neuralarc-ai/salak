"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Key, Plus, Trash2, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { api } from "@/lib/api-client"
import { getAuthToken } from "@/lib/api-client"

interface ApiKey {
  id: string
  name: string
  is_active: boolean
  created_at: string
  last_used_at?: string
}

export default function ApiKeysPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [formData, setFormData] = useState({
    name: "",
    apiKey: "",
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication before fetching API keys
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      // First, ensure we have a valid token
      const token = await getAuthToken()
      if (!token) {
        console.log('No auth token found, redirecting to login')
        router.push('/login?redirect=/settings/api-keys')
        return
      }

      // Token exists, proceed to fetch API keys
      await fetchApiKeys()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login?redirect=/settings/api-keys')
    }
  }

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      setMessage(null) // Clear any previous messages
      
      // Ensure token is available before making request
      const token = await getAuthToken()
      if (!token) {
        console.log('No token available, redirecting to login')
        router.push('/login?redirect=/settings/api-keys')
        return
      }
      
      const response = await api.get('/api-keys')
      
      // Handle 401 Unauthorized - redirect to login
      if (!response.success && response.error === 'Unauthorized') {
        console.log('Unauthorized response, redirecting to login')
        router.push('/login?redirect=/settings/api-keys')
        return
      }
      
      if (response.success) {
        setApiKeys(response.apiKeys || [])
      } else {
        const errorMessage = response.error || 'Failed to fetch API keys'
        setMessage({ type: 'error', text: errorMessage })
        console.error('Failed to fetch API keys:', errorMessage)
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('401')) {
        router.push('/login?redirect=/settings/api-keys')
        return
      }
      
      setMessage({ 
        type: 'error', 
        text: 'Failed to fetch API keys. Please refresh the page or contact support if the issue persists.' 
      })
    } finally {
      setLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setNameError(null)

    // Validate name
    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      setNameError('API Key Name is required')
      setMessage({ type: 'error', text: 'API Key Name is required' })
      return
    }

    if (trimmedName.length < 3) {
      setNameError('API Key Name must be at least 3 characters long')
      setMessage({ type: 'error', text: 'API Key Name must be at least 3 characters long' })
      return
    }

    // Validate API key
    if (!formData.apiKey.trim()) {
      setMessage({ type: 'error', text: 'API key is required. Please paste your existing API key.' })
      return
    }

    if (formData.apiKey.length < 32) {
      setMessage({ type: 'error', text: 'API key must be at least 32 characters long' })
      return
    }

    setSaving(true)

    try {
      const response = await api.post('/api-keys', {
        name: formData.name.trim(),
        apiKey: formData.apiKey.trim(),
      })

      if (response.success) {
        setMessage({ type: 'success', text: response.message || 'API key stored securely' })
        setFormData({ name: "", apiKey: "" })
        setShowApiKey(false)
        // Refresh the list
        await fetchApiKeys()
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to store API key' })
      }
    } catch (error) {
      console.error('Store API key error:', error)
      setMessage({ type: 'error', text: 'Failed to store API key. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke the API key "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await api.delete(`/api-keys/${id}`)

      if (response.success) {
        setMessage({ type: 'success', text: response.message || 'API key revoked successfully' })
        // Refresh the list
        await fetchApiKeys()
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to revoke API key' })
      }
    } catch (error) {
      console.error('Revoke API key error:', error)
      setMessage({ type: 'error', text: 'Failed to revoke API key. Please try again.' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <LayoutWrapper>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Key className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">API Keys</h1>
              <p className="text-muted-foreground">
                Manage your API keys securely. Keys are encrypted and cannot be viewed again.
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 rounded-lg border p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-destructive/15 border-destructive/50 text-destructive'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <p className="font-medium">{message.text}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Section A: Store API Key */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add API Key
              </CardTitle>
              <CardDescription>
                Store your existing API key securely
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">API Key Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. OpenAI Key"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                      // Clear error when user starts typing
                      if (nameError) {
                        setNameError(null)
                      }
                    }}
                    required
                    disabled={saving}
                    className={nameError ? "border-destructive" : ""}
                  />
                  {nameError && (
                    <p className="text-xs text-destructive">{nameError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      placeholder="Paste your existing API key"
                      value={formData.apiKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                      required
                      disabled={saving}
                      className="pr-10 font-mono text-sm"
                    />
                    {formData.apiKey && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKey(!showApiKey)}
                        disabled={saving}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste your existing API key. It will be stored securely.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={saving || !formData.name.trim() || formData.name.trim().length < 3 || !formData.apiKey.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Storing...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Store API Key
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Your API key will be encrypted and stored securely. It cannot be viewed again after storage.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Section B: Existing API Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Existing API Keys
              </CardTitle>
              <CardDescription>
                Manage your existing API keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No API keys found. Add your first API key to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>
                            <Badge variant={key.is_active ? "default" : "secondary"}>
                              {key.is_active ? "Active" : "Revoked"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(key.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(key.id, key.name)}
                              disabled={!key.is_active}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Revoke
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  )
}

