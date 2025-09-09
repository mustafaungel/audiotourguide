import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Settings, TestTube } from 'lucide-react';
import { EmailSystemTest } from '@/components/EmailSystemTest';
import { AdminEmailTesting } from '@/components/AdminEmailTesting';

export const EnhancedEmailTesting = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
            <Mail className="h-6 w-6" />
            Email System Management
          </h2>
          <p className="text-muted-foreground">
            Configure and test your email system for purchase confirmations
          </p>
        </div>

        <Tabs defaultValue="configuration" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration Test
            </TabsTrigger>
            <TabsTrigger value="template-testing" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Template Testing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="space-y-4">
            <EmailSystemTest />
          </TabsContent>

          <TabsContent value="template-testing" className="space-y-4">
            <AdminEmailTesting />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};