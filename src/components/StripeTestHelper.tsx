import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertCircle } from 'lucide-react';

export const StripeTestHelper: React.FC = () => {
  return (
    <Card className="w-full max-w-md mb-4 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-300">
          <CreditCard className="w-4 h-4" />
          Test Mode Active
          <Badge variant="secondary" className="text-xs">DEMO</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-orange-700 dark:text-orange-300">
            <p className="font-medium mb-1">Use test card for testing:</p>
            <div className="font-mono bg-card/60 p-2 rounded border">
              <div>Card: 4242 4242 4242 4242</div>
              <div>Expiry: Any future date</div>
              <div>CVC: Any 3 digits</div>
            </div>
          </div>
        </div>
        <p className="text-xs text-orange-600">
          No real charges will be made in test mode.
        </p>
      </CardContent>
    </Card>
  );
};