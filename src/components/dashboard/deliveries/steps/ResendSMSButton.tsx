import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface ResendSMSButtonProps {
  onResend: () => Promise<void>;
  isLoading: boolean;
}

export function ResendSMSButton({ onResend, isLoading }: ResendSMSButtonProps) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleResend = async () => {
    await onResend();
    setCountdown(59);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleResend}
      disabled={countdown > 0 || isLoading}
      className="h-8"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : countdown > 0 ? (
        `Reenviar SMS (${countdown}s)`
      ) : (
        'Reenviar SMS'
      )}
    </Button>
  );
}
