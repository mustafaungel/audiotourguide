import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ELEVENLABS_LANGUAGES } from '@/data/countries-full';
import { cn } from '@/lib/utils';

interface LanguagePickerProps {
  selected: string[];
  onChange: (codes: string[]) => void;
  minSelected?: number;
  className?: string;
}

export function LanguagePicker({ selected, onChange, minSelected = 1, className }: LanguagePickerProps) {
  const [open, setOpen] = useState(false);

  const toggle = (code: string) => {
    if (selected.includes(code)) {
      if (selected.length <= minSelected) return;
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  const remove = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selected.length <= minSelected) return;
    onChange(selected.filter((c) => c !== code));
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {selected.map((code) => {
        const lang = ELEVENLABS_LANGUAGES.find((l) => l.code === code);
        if (!lang) return null;
        const canRemove = selected.length > minSelected;
        return (
          <div
            key={code}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-sm font-medium"
          >
            <span className="text-base leading-none">{lang.flag}</span>
            <span className="uppercase tracking-wide text-xs">{code}</span>
            {canRemove && (
              <button
                onClick={(e) => remove(code, e)}
                className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${lang.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-full gap-1 border-dashed hover:border-primary hover:bg-primary/5"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs">Add language</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search languages..." className="h-9" />
            <CommandList className="max-h-[260px]">
              <CommandEmpty>No language found.</CommandEmpty>
              <CommandGroup>
                {ELEVENLABS_LANGUAGES.map((lang) => {
                  const isSelected = selected.includes(lang.code);
                  return (
                    <CommandItem
                      key={lang.code}
                      value={`${lang.name} ${lang.code}`}
                      onSelect={() => toggle(lang.code)}
                      className="cursor-pointer"
                    >
                      <span className="text-base mr-2">{lang.flag}</span>
                      <span className="flex-1">{lang.name}</span>
                      <span className="text-xs text-muted-foreground uppercase mr-2">{lang.code}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
