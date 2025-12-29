"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, Copy, Check } from "lucide-react"

interface TableStatus {
  name: string
  exists: boolean
  error?: string
}

export default function DbInitPage() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<{
    ready: boolean
    tables: TableStatus[]
    missingTables: string[]
    message: string
    sqlScript?: string
    instructions?: string[]
  } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkDatabase()
  }, [])

  const checkDatabase = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/db/init')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to check database:', error)
    } finally {
      setLoading(false)
    }
  }

  const copySQL = () => {
    if (status?.sqlScript) {
      navigator.clipboard.writeText(status.sqlScript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Initialization</h1>
        <p className="text-muted-foreground">
          Check and set up your database tables
        </p>
      </div>

      {status && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {status.ready ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Database Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={status.ready ? "text-green-600" : "text-red-600 mb-4"}>
                {status.message}
              </p>

              <div className="space-y-2 mt-4">
                {status.tables.map((table) => (
                  <div key={table.name} className="flex items-center justify-between border-b pb-2">
                    <span className="capitalize">{table.name.replace(/_/g, ' ')}</span>
                    {table.exists ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Ready
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        Missing
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {!status.ready && status.sqlScript && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>SQL Setup Script</CardTitle>
                    <CardDescription>
                      Copy and run this script in Supabase SQL Editor
                    </CardDescription>
                  </div>
                  <Button onClick={copySQL} variant="outline" size="sm">
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy SQL
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {status.instructions && (
                  <div className="mb-4 p-4 bg-muted rounded-lg">
                    <p className="font-semibold mb-2">Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      {status.instructions.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{status.sqlScript}</code>
                </pre>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button onClick={checkDatabase} variant="outline">
              Refresh Status
            </Button>
            {status.ready && (
              <Button onClick={() => window.location.href = '/signup'}>
                Go to Sign Up
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

