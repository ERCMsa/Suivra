import { useState, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  folder: string;
}

const ImageUpload = ({ currentUrl, onUploaded, folder }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('attachments').upload(path, file);
    if (error) { toast.error('Upload failed'); setUploading(false); return; }

    const { data } = supabase.storage.from('attachments').getPublicUrl(path);
    setPreview(data.publicUrl);
    onUploaded(data.publicUrl);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden border">
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <Button type="button" aria-label="Retirer la photo" size="icon" variant="destructive" className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full" onClick={() => { setPreview(null); onUploaded(''); }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="gap-2 rounded-xl text-xs" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <ImagePlus className="h-3.5 w-3.5" />
          {uploading ? '...' : 'Photo'}
        </Button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
};

export default ImageUpload;
