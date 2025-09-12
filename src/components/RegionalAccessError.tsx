import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Globe, RefreshCw, ExternalLink } from "lucide-react";

interface RegionalAccessErrorProps {
  error?: string;
  isRegionalIssue?: boolean;
  onRetry?: () => void;
  onTryFallback?: () => void;
  showFallbackOption?: boolean;
}

export default function RegionalAccessError({
  error,
  isRegionalIssue = false,
  onRetry,
  onTryFallback,
  showFallbackOption = true
}: RegionalAccessErrorProps) {
  const getErrorContent = () => {
    if (isRegionalIssue) {
      return {
        title: "Regional Access Restriction",
        description: "Content access appears to be restricted in your location. This might be due to regional network policies or content delivery limitations.",
        suggestions: [
          "Try using a VPN connection to a different region",
          "Check if your firewall or network security settings are blocking the content",
          "Contact your network administrator if you're on a corporate network",
          "Try accessing from a different network (mobile data vs WiFi)"
        ]
      };
    }

    return {
      title: "Network Connection Issue",
      description: "We're having trouble loading the audio content. This could be due to network connectivity issues or temporary service disruption.",
      suggestions: [
        "Check your internet connection stability",
        "Try refreshing the page or restarting your browser",
        "Disable any ad blockers or browser extensions temporarily",
        "Try accessing the content later if this persists"
      ]
    };
  };

  const { title, description, suggestions } = getErrorContent();

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-800 dark:text-amber-300 flex items-center gap-2">
        {isRegionalIssue && <Globe className="h-4 w-4" />}
        {title}
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-400 space-y-3">
        <p>{description}</p>
        
        {error && (
          <div className="text-xs bg-amber-100 dark:bg-amber-900/30 p-2 rounded border border-amber-200 dark:border-amber-800">
            <strong>Technical details:</strong> {error}
          </div>
        )}

        <div className="space-y-2">
          <p className="font-medium">Troubleshooting suggestions:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {onRetry && (
            <Button 
              onClick={onRetry} 
              size="sm" 
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry Connection
            </Button>
          )}
          
          {onTryFallback && showFallbackOption && (
            <Button 
              onClick={onTryFallback} 
              size="sm" 
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
            >
              Try Alternative Source
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="ghost"
            className="text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30"
            asChild
          >
            <a 
              href="mailto:support@audioguides.com?subject=Regional Access Issue"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Contact Support
            </a>
          </Button>
        </div>

        {isRegionalIssue && (
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 p-2 rounded border border-amber-200 dark:border-amber-800">
            <strong>Note:</strong> If you're traveling or using a VPN, content availability may vary by location due to licensing and regional policies.
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}