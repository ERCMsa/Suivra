import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupplierAvatarProps {
  name: string;
  imageUrl?: string | null;
  phone?: string | null;
  category?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  interactive?: boolean;
  productName?: string;
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-base',
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// Stable color from name hash → consistent per supplier
const getColorFromName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
};

const SupplierAvatar = ({
  name,
  imageUrl,
  phone,
  category,
  size = 'sm',
  showTooltip = true,
  interactive = true,
  productName,
  className,
}: SupplierAvatarProps) => {
  const bgColor = getColorFromName(name);

  const avatar = (
    <Avatar
      className={cn(
        sizeMap[size],
        'ring-2 ring-background shadow-md cursor-pointer transition-transform hover:scale-110',
        className,
      )}
    >
      {imageUrl && <AvatarImage src={imageUrl} alt={name} className="object-cover" />}
      <AvatarFallback
        className="font-semibold text-white"
        style={{ backgroundColor: bgColor }}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );

  const tooltipText = (
    <div className="text-xs">
      <div className="font-semibold">{name}</div>
      {phone && <div className="opacity-80">{phone}</div>}
    </div>
  );

  if (!interactive) {
    if (!showTooltip) return avatar;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{avatar}</TooltipTrigger>
        <TooltipContent side="top">{tooltipText}</TooltipContent>
      </Tooltip>
    );
  }

  // Interactive: click opens popover with details
  return (
    <Popover>
      <PopoverTrigger asChild>
        {showTooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>{avatar}</TooltipTrigger>
            <TooltipContent side="top">{tooltipText}</TooltipContent>
          </Tooltip>
        ) : (
          avatar
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-2xl p-3" side="top">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
            {imageUrl && <AvatarImage src={imageUrl} alt={name} className="object-cover" />}
            <AvatarFallback className="font-semibold text-white" style={{ backgroundColor: bgColor }}>
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{name}</p>
            {category && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                <Building2 className="h-3 w-3" />
                {category}
              </p>
            )}
          </div>
        </div>
        {phone ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 flex-1 gap-1.5 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`tel:${phone}`, '_self');
              }}
            >
              <Phone className="h-3.5 w-3.5 text-blue-500" />
              {phone}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
              onClick={(e) => {
                e.stopPropagation();
                const msg = encodeURIComponent(
                  productName
                    ? `Hello, I would like info about: ${productName}`
                    : `Hello, ${name}`,
                );
                window.open(
                  `https://wa.me/${phone.replace(/[^0-9+]/g, '')}?text=${msg}`,
                  '_blank',
                );
              }}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic text-center py-1">
            No contact info
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default SupplierAvatar;
