interface SegmentedControlProps<T extends string> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, className = '' }: SegmentedControlProps<T>) {
  return (
    <div className={`flex bg-background/50 border border-card-border p-1 rounded-xl ${className}`}>
      {options.map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 ${
              isActive 
                ? 'bg-card-bg shadow-sm text-foreground' 
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
