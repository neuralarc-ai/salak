"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface TestResult {
  success: boolean
  message: string
  envCheck?: {
    hasUrl: boolean
    hasServiceKey: boolean
    urlLength: number
    serviceKeyLength: number
  }
  tests?: {
    users: { success: boolean; error: string | null; count: number }
    documents: { success: boolean; error: string | null; count: number }
    categories: { success: boolean; error: string | null; count: number }
    document_versions: { success: boolean; error: string | null; count: number }
    system_logs: { success: boolean; error: string | null; count: number }
  }
  summary?: {
    tablesAccessible: string[]
    tablesWithErrors: Array<{ table: string; error: string }>
    totalRecords: {
      users: number
      documents: number
      categories: number
      document_versions: number
      system_logs: number
    }
  }
  error?: string
  details?: string
}

export default function TestDbPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const runTest = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test/db")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to connect to test endpoint",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Connection Test</h1>
        <p className="text-muted-foreground">
          Test your Supabase database connection and verify all tables are set up correctly.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
          <CardDescription>
            Click the button below to test your database connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runTest} disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Run Database Test"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Overall Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={result.success ? "text-green-600" : "text-red-600"}>
                {result.message}
              </p>
              {result.error && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                  <p className="text-sm text-destructive font-medium">Error:</p>
                  <p className="text-sm text-destructive">{result.error}</p>
                </div>
              )}
              {result.details && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm">{result.details}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Environment Variables Check */}
          {result.envCheck && (
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>NEXT_PUBLIC_SUPABASE_URL</span>
                    {result.envCheck.hasUrl ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Set ({result.envCheck.urlLength} chars)
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        Missing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SUPABASE_SERVICE_ROLE_KEY</span>
                    {result.envCheck.hasServiceKey ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Set ({result.envCheck.serviceKeyLength} chars)
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        Missing
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table Tests */}
          {result.tests && (
            <Card>
              <CardHeader>
                <CardTitle>Table Tests</CardTitle>
                <CardDescription>Status of each database table</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(result.tests).map(([tableName, test]) => (
                    <div key={tableName} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {tableName.replace(/_/g, " ")}
                        </span>
                        {test.success ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Accessible
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                            Error
                          </span>
                        )}
                      </div>
                      {test.success && (
                        <p className="text-sm text-muted-foreground">
                          Records: {test.count}
                        </p>
                      )}
                      {test.error && (
                        <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                          {test.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {result.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Accessible Tables:</h4>
                    {result.summary.tablesAccessible.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {result.summary.tablesAccessible.map((table) => (
                          <li key={table} className="text-sm text-green-600">
                            {table}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tables accessible</p>
                    )}
                  </div>

                  {result.summary.tablesWithErrors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-destructive">Tables with Errors:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {result.summary.tablesWithErrors.map(({ table, error }) => (
                          <li key={table} className="text-sm">
                            <span className="font-medium">{table}:</span>{" "}
                            <span className="text-destructive">{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Total Records:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(result.summary.totalRecords).map(([table, count]) => (
                        <div key={table} className="flex justify-between">
                          <span className="capitalize">{table.replace(/_/g, " ")}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {!result.success && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Ensure your <code className="bg-muted px-1 rounded">.env.local</code> file exists with all required variables</li>
                  <li>Go to your Supabase project SQL Editor</li>
                  <li>Copy and paste the contents of <code className="bg-muted px-1 rounded">supabase-setup.sql</code></li>
                  <li>Run the SQL script to create all tables</li>
                  <li>Run this test again to verify</li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

