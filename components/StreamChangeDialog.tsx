'use client';

import { useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StreamChangeDialogProps {
  userId: number;
  currentStream: string | null;
  userName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STREAMS = {
  '3rd_stream': '3-й поток',
  '4th_stream': '4-й поток', 
  '5th_stream': '5-й поток'
};

export default function StreamChangeDialog({ 
  userId, 
  currentStream, 
  userName, 
  open, 
  onClose, 
  onSuccess 
}: StreamChangeDialogProps) {
  const [selectedStream, setSelectedStream] = useState<string>(currentStream || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    // Validation
    if (!selectedStream) {
      setError('Выберите поток');
      return;
    }

    if (selectedStream === currentStream) {
      setError('Пользователь уже находится в выбранном потоке');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update user's stream using dedicated endpoint
      const response = await fetch(`/api/users/${userId}/stream`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newStream: selectedStream
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обновлении потока');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Ошибка при обновлении потока');
      }

      // Success - close dialog and refresh parent
      onSuccess();
      onClose();
      
    } catch (err) {
      console.error('Error updating stream:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении потока');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStream(currentStream || '');
    setError(null);
    onClose();
  };

  const getCurrentStreamName = () => {
    return currentStream ? STREAMS[currentStream as keyof typeof STREAMS] || currentStream : 'Не указан';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Изменить поток пользователя
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Пользователь</div>
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Текущий поток: <span className="font-medium">{getCurrentStreamName()}</span>
            </div>
            {!currentStream && (
              <div className="text-xs text-amber-600 mt-1">
                ⚠️ У пользователя не указан поток
              </div>
            )}
          </div>

          {/* Stream Selection */}
          <div className="space-y-2">
            <Label>Новый поток</Label>
            <Select 
              value={selectedStream} 
              onValueChange={setSelectedStream}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите поток" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STREAMS).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}