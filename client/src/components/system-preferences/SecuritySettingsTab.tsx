import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Lock, Key, AlertTriangle, Eye, Clock, UserCheck } from 'lucide-react';

interface SecuritySettingsTabProps {
  preferences: any;
  refetch: () => void;
}

const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    passwordMinLength: '8',
    passwordComplexity: true,
    sessionTimeout: '30',
    twoFactorAuth: false,
    loginAttempts: '5',
    auditLogging: true,
    dataEncryption: true,
    accessLogging: true,
  });

  useEffect(() => {
    if (preferences) {
      const securityPrefs = preferences.filter((pref: any) => pref.category === 'security');
      if (securityPrefs.length) {
        const prefsObj: any = {};
        securityPrefs.forEach((pref: any) => {
          prefsObj[pref.key.replace('security_', '')] = pref.value;
        });
        
        setSettings({
          passwordMinLength: prefsObj.passwordMinLength?.toString() || '8',
          passwordComplexity: prefsObj.passwordComplexity || true,
          sessionTimeout: prefsObj.sessionTimeout?.toString() || '30',
          twoFactorAuth: prefsObj.twoFactorAuth || false,
          loginAttempts: prefsObj.loginAttempts?.toString() || '5',
          auditLogging: prefsObj.auditLogging || true,
          dataEncryption: prefsObj.dataEncryption || true,
          accessLogging: prefsObj.accessLogging || true,
        });
      }
    }
  }, [preferences]);

  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: any }) => {
      return apiRequest('PATCH', `/api/system-preferences/${key}`, { value });
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update security setting.',
        variant: 'destructive',
      });
    },
  });

  const createPreferenceMutation = useMutation({
    mutationFn: async (preference: any) => {
      return apiRequest('POST', `/api/system-preferences`, preference);
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create security setting.',
        variant: 'destructive',
      });
    },
  });

  const handleChangeSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    const fullKey = `security_${key}`;
    const existingPref = preferences?.find((pref: any) => pref.key === fullKey);

    if (existingPref) {
      updatePreferenceMutation.mutate({ key: fullKey, value });
    } else {
      createPreferenceMutation.mutate({
        key: fullKey,
        value,
        category: 'security',
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        description: `Security setting for ${key}`,
        dataType: typeof value === 'boolean' ? 'boolean' : 'string',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Security Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure system security policies and authentication settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Security Audit
          </Button>
          <Button variant="outline" size="sm">
            Export Settings
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <Shield className="h-6 w-6 mx-auto text-green-700 mb-1" />
          <div className="text-sm text-green-600">Security Level</div>
          <div className="text-lg font-bold text-green-700">High</div>
        </div>
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Lock className="h-6 w-6 mx-auto text-blue-700 mb-1" />
          <div className="text-sm text-blue-600">Session Timeout</div>
          <div className="text-lg font-bold text-blue-700">{settings.sessionTimeout}m</div>
        </div>
        <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <Key className="h-6 w-6 mx-auto text-purple-700 mb-1" />
          <div className="text-sm text-purple-600">Min Password</div>
          <div className="text-lg font-bold text-purple-700">{settings.passwordMinLength} chars</div>
        </div>
        <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="h-6 w-6 mx-auto text-orange-700 mb-1" />
          <div className="text-sm text-orange-600">Login Attempts</div>
          <div className="text-lg font-bold text-orange-700">{settings.loginAttempts}</div>
        </div>
      </div>

      {/* Password Policies */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Password Policies</CardTitle>
              <CardDescription>Configure password requirements and complexity rules</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => handleChangeSetting('passwordMinLength', e.target.value)}
                min="6"
                max="20"
              />
              <p className="text-sm text-muted-foreground">
                Minimum number of characters required for passwords
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="loginAttempts">Maximum Login Attempts</Label>
              <Input
                id="loginAttempts"
                type="number"
                value={settings.loginAttempts}
                onChange={(e) => handleChangeSetting('loginAttempts', e.target.value)}
                min="3"
                max="10"
              />
              <p className="text-sm text-muted-foreground">
                Number of failed attempts before account lockout
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="passwordComplexity">Password Complexity</Label>
                <p className="text-sm text-muted-foreground">
                  Require uppercase, lowercase, numbers, and special characters
                </p>
              </div>
            </div>
            <Switch
              id="passwordComplexity"
              checked={settings.passwordComplexity}
              onCheckedChange={(checked) => handleChangeSetting('passwordComplexity', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Authentication & Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Authentication & Access Control</CardTitle>
              <CardDescription>Configure session management and access controls</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Select
                value={settings.sessionTimeout}
                onValueChange={(value) => handleChangeSetting('sessionTimeout', value)}
              >
                <SelectTrigger id="sessionTimeout">
                  <SelectValue placeholder="Select timeout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Automatic logout time for inactive sessions
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require additional verification for enhanced security
                </p>
              </div>
            </div>
            <Switch
              id="twoFactorAuth"
              checked={settings.twoFactorAuth}
              onCheckedChange={(checked) => handleChangeSetting('twoFactorAuth', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit & Monitoring */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Audit & Monitoring</CardTitle>
              <CardDescription>Configure system monitoring and audit trail settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="auditLogging">Audit Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Log all system activities and user actions
                </p>
              </div>
            </div>
            <Switch
              id="auditLogging"
              checked={settings.auditLogging}
              onCheckedChange={(checked) => handleChangeSetting('auditLogging', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="accessLogging">Access Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Track user login attempts and access patterns
                </p>
              </div>
            </div>
            <Switch
              id="accessLogging"
              checked={settings.accessLogging}
              onCheckedChange={(checked) => handleChangeSetting('accessLogging', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="dataEncryption">Data Encryption</Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt sensitive data at rest and in transit
                </p>
              </div>
            </div>
            <Switch
              id="dataEncryption"
              checked={settings.dataEncryption}
              onCheckedChange={(checked) => handleChangeSetting('dataEncryption', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettingsTab;