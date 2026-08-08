import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { vi } from 'date-fns/locale'
import { format, isValid, parse } from 'date-fns'
import { cn } from '@/lib/utils'

registerLocale('vi', vi)

export interface DateTimePickerProps {
  value?: string
  onChange: (value: string) => void
  withTime?: boolean
  placeholder?: string
  className?: string
  id?: string
}

function parsePickerValue(
  value: string | undefined,
  withTime: boolean,
): Date | null {
  if (!value) return null
  const date = withTime
    ? parse(value, "yyyy-MM-dd'T'HH:mm", new Date())
    : parse(value, 'yyyy-MM-dd', new Date())
  return isValid(date) ? date : null
}

function formatPickerValue(date: Date, withTime: boolean): string {
  return withTime
    ? format(date, "yyyy-MM-dd'T'HH:mm")
    : format(date, 'yyyy-MM-dd')
}

const DateInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  ({ className, id, value, placeholder, ...rest }, ref) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground">
        <span className="material-symbols-outlined text-base opacity-50">
          calendar_today
        </span>
      </span>
      <input
        ref={ref}
        id={id}
        value={value}
        placeholder={placeholder}
        {...rest}
        readOnly
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent py-1 pl-9 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          !value && 'text-muted-foreground',
          className,
        )}
      />
    </div>
  ),
)
DateInput.displayName = 'DateInput'

export function DateTimePicker({
  value,
  onChange,
  withTime = false,
  placeholder,
  className,
  id,
}: DateTimePickerProps) {
  const date = parsePickerValue(value, withTime)

  return (
    <DatePicker
      selected={date}
      onChange={(d: Date | null) =>
        onChange(d ? formatPickerValue(d, withTime) : '')
      }
      locale="vi"
      showTimeSelect={withTime}
      timeIntervals={5}
      timeCaption="Giờ"
      dateFormat={withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'}
      placeholderText={placeholder || 'Chọn ngày...'}
      isClearable
      todayButton="Hôm nay"
      showPopperArrow={false}
      popperClassName="z-[60]"
      customInput={
        <DateInput
          id={id}
          className={className}
          placeholder={placeholder}
          readOnly
        />
      }
    />
  )
}
