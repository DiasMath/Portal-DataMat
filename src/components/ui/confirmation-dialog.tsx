"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  itemName: string;
  onConfirm: () => void;
  cancelLabel?: string;
  requireTyping?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  itemName,
  onConfirm,
  cancelLabel = "Cancelar",
  requireTyping = true,
}: ConfirmationDialogProps) {
  const [confirmName, setConfirmName] = useState("");

  const isValid = requireTyping ? confirmName === itemName : true;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      setConfirmName("");
    }
  };

  const handleCancel = () => {
    setConfirmName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-[#1a1a1a] border border-red-500/30">
        <DialogHeader>
          <DialogTitle className="font-heading text-red-500">
            {title}
          </DialogTitle>
          <DialogDescription className="font-body">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requireTyping && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-name" className="text-sm text-gray-300">
                Para confirmar, digite: <strong className="text-white">"{itemName}"</strong>
              </Label>
              <Input
                id="confirm-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={`Digite "${itemName}"`}
                className="border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 focus-visible:ring-[3px]"
              />
            </div>
          </div>
        )}

        {!requireTyping && (
          <div className="py-4">
            <p className="text-sm text-gray-300">{description}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={requireTyping && !isValid}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}