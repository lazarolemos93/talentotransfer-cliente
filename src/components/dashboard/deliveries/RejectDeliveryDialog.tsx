'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface RejectDeliveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  deliveryTitle: string;
}

export function RejectDeliveryDialog({
  isOpen,
  onClose,
  onConfirm,
  deliveryTitle,
}: RejectDeliveryDialogProps) {
  const [message, setMessage] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar Entrega</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Está a punto de rechazar la entrega: <strong>{deliveryTitle}</strong>
          </p>
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Mensaje de rechazo
            </label>
            <Textarea
              id="message"
              placeholder="Explique el motivo del rechazo..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(message)}
            disabled={!message.trim()}
          >
            Confirmar Rechazo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
