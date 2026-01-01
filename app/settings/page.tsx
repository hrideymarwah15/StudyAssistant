"use client"

import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { auth } from "@/lib/firebase"
import {
  Settings, Target, Clock, Calendar, Bell, Moon, Sun,
  Save, User, Shield, Palette
} from "lucide-react"
import { toast } from "sonner"

interface UserSettings {
  dailyStudyHours: number
  weeklyStudyHours: number
  dailyTaskLimit: number
  weeklyTaskLimit: number
  notificationsEnabled: boolean
  reminderTime: string
  theme: 'light' | 'dark' | 'system'
  focusSessionDuration: number
  breakDuration: number
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    dailyStudyHours: 2,
    weeklyStudyHours: 14,
    dailyTaskLimit: 5,
    weeklyTaskLimit: 25,
    notificationsEnabled: true,
    reminderTime: "09:00",
    theme: 'system',
    focusSessionDuration: 25,
    breakDuration: 5
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (!currentUser) {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const handleSaveSettings = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Here you would save to Firestore
      // For now, just show success message
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout 
      title="Settings" 
      subtitle="Customize your study experience"
    >
      <Tabs defaultValue="study-targets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="study-targets" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Study Targets
            </TabsTrigger>
            <TabsTrigger value="focus" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Focus & Breaks
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="study-targets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Custom Study Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="daily-hours">Daily Study Hours Target</Label>
                    <Input
                      id="daily-hours"
                      type="number"
                      min="0.5"
                      max="12"
                      step="0.5"
                      value={settings.dailyStudyHours}
                      onChange={(e) => updateSetting('dailyStudyHours', parseFloat(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Set your daily study goal in hours
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weekly-hours">Weekly Study Hours Target</Label>
                    <Input
                      id="weekly-hours"
                      type="number"
                      min="1"
                      max="84"
                      step="1"
                      value={settings.weeklyStudyHours}
                      onChange={(e) => updateSetting('weeklyStudyHours', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Set your weekly study goal in hours
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="daily-tasks">Daily Task Limit</Label>
                    <Input
                      id="daily-tasks"
                      type="number"
                      min="1"
                      max="20"
                      value={settings.dailyTaskLimit}
                      onChange={(e) => updateSetting('dailyTaskLimit', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum tasks to complete per day
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weekly-tasks">Weekly Task Limit</Label>
                    <Input
                      id="weekly-tasks"
                      type="number"
                      min="5"
                      max="100"
                      value={settings.weeklyTaskLimit}
                      onChange={(e) => updateSetting('weeklyTaskLimit', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum tasks to complete per week
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="focus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Focus Session Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="focus-duration">Focus Session Duration (minutes)</Label>
                    <Input
                      id="focus-duration"
                      type="number"
                      min="5"
                      max="90"
                      value={settings.focusSessionDuration}
                      onChange={(e) => updateSetting('focusSessionDuration', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Length of focused work sessions
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="break-duration">Break Duration (minutes)</Label>
                    <Input
                      id="break-duration"
                      type="number"
                      min="1"
                      max="30"
                      value={settings.breakDuration}
                      onChange={(e) => updateSetting('breakDuration', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Length of breaks between sessions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders and study suggestions
                    </p>
                  </div>
                  <Switch
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(checked) => updateSetting('notificationsEnabled', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="reminder-time">Daily Reminder Time</Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    value={settings.reminderTime}
                    onChange={(e) => updateSetting('reminderTime', e.target.value)}
                    disabled={!settings.notificationsEnabled}
                  />
                  <p className="text-sm text-muted-foreground">
                    When to send daily study reminders
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={settings.theme === 'light' ? 'default' : 'outline'}
                      onClick={() => updateSetting('theme', 'light')}
                      className="flex items-center gap-2"
                    >
                      <Sun className="w-4 h-4" />
                      Light
                    </Button>
                    <Button
                      variant={settings.theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => updateSetting('theme', 'dark')}
                      className="flex items-center gap-2"
                    >
                      <Moon className="w-4 h-4" />
                      Dark
                    </Button>
                    <Button
                      variant={settings.theme === 'system' ? 'default' : 'outline'}
                      onClick={() => updateSetting('theme', 'system')}
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      System
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme or follow system settings
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
    </Layout>
  )
}