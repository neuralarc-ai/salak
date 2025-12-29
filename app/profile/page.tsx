"use client"

import { useEffect, useState } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Calendar, Loader2, Save } from "lucide-react"
import { api } from "@/lib/api-client"

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })
  const [message, setMessage] = useState("")
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [changeEmailData, setChangeEmailData] = useState({ newEmail: "", password: "" })
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/auth/me')
      if (response.success) {
        const userData = response.user
        setUser(userData)
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
        })
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSaving(true)
    setMessage("")

    try {
      const response = await api.post('/auth/update-profile', {
        name: formData.name.trim(),
      })

      if (response.success) {
        setMessage("Profile updated successfully!")
        // Refresh user data
        await fetchUserProfile()
      } else {
        setMessage(response.error || "Failed to update profile")
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setMessage("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!changeEmailData.newEmail.trim() || !changeEmailData.password) return

    setSaving(true)
    setMessage("")

    try {
      const response = await api.post('/auth/change-email', {
        newEmail: changeEmailData.newEmail.trim(),
        password: changeEmailData.password,
      })

      if (response.success) {
        setMessage("Email change request sent. Please check both email addresses for verification.")
        setShowChangeEmail(false)
        setChangeEmailData({ newEmail: "", password: "" })
      } else {
        setMessage(response.error || "Failed to change email")
      }
    } catch (error) {
      console.error('Email change error:', error)
      setMessage("Failed to change email. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!changePasswordData.currentPassword || !changePasswordData.newPassword) return
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setMessage("New passwords do not match")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: changePasswordData.currentPassword,
        newPassword: changePasswordData.newPassword,
      })

      if (response.success) {
        setMessage("Password changed successfully!")
        setShowChangePassword(false)
        setChangePasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setMessage(response.error || "Failed to change password")
      }
    } catch (error) {
      console.error('Password change error:', error)
      setMessage("Failed to change password. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return

    setSaving(true)
    setMessage("")

    try {
      const response = await api.post('/auth/delete-account')

      if (response.success) {
        setMessage("Account deletion request processed. You will be logged out.")
        // Logout and redirect after a delay
        setTimeout(() => {
          localStorage.removeItem("user")
          localStorage.removeItem("isAuthenticated")
          window.location.href = "/login"
        }, 2000)
      } else {
        setMessage(response.error || "Failed to delete account")
      }
    } catch (error) {
      console.error('Account deletion error:', error)
      setMessage("Failed to delete account. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  if (!user) {
    return (
      <LayoutWrapper>
        <div className="p-8">
          <p>Failed to load profile. Please try again.</p>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Information */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and account information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if you need to update your email.
                    </p>
                  </div>

                  {message && (
                    <div className={`p-3 rounded-md text-sm ${
                      message.includes('successfully')
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-destructive/15 text-destructive border border-destructive/20'
                    }`}>
                      {message}
                    </div>
                  )}

                  <Button type="submit" disabled={saving || !formData.name.trim()}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
                <CardDescription>
                  Your activity summary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Security */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email Verification</p>
                    <p className="text-xs text-muted-foreground">
                      Your email is verified
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Verified
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Password</p>
                    <p className="text-xs text-muted-foreground">
                      Last updated recently
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChangePassword(true)}
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowChangeEmail(true)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Change Email
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowChangePassword(true)}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleDeleteAccount}
                >
                  <User className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>

            {/* Change Email Form */}
            {showChangeEmail && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Email Address</CardTitle>
                  <CardDescription>
                    Enter your new email address and current password to change your email.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangeEmail} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">New Email Address</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={changeEmailData.newEmail}
                        onChange={(e) => setChangeEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
                        placeholder="Enter new email address"
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailPassword">Current Password</Label>
                      <Input
                        id="emailPassword"
                        type="password"
                        value={changeEmailData.password}
                        onChange={(e) => setChangeEmailData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter your current password"
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          'Change Email'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowChangeEmail(false)
                          setChangeEmailData({ newEmail: "", password: "" })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Change Password Form */}
            {showChangePassword && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Enter your current password and choose a new secure password.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={changePasswordData.currentPassword}
                        onChange={(e) => setChangePasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter your current password"
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={changePasswordData.newPassword}
                        onChange={(e) => setChangePasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={changePasswordData.confirmPassword}
                        onChange={(e) => setChangePasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        required
                        disabled={saving}
                      />
                      {changePasswordData.confirmPassword && changePasswordData.newPassword !== changePasswordData.confirmPassword && (
                        <p className="text-xs text-destructive">Passwords do not match</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={saving || changePasswordData.newPassword !== changePasswordData.confirmPassword}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowChangePassword(false)
                          setChangePasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}
