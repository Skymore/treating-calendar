import { CalendarDate } from "@internationalized/date";
import { Personnel } from "../types/types";

interface CalendarCellProps {
  date: CalendarDate;
  isThursday: boolean;
  person: Personnel | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFocused: boolean;
  isSelected: boolean;
  isPast: boolean;
  onSelect: (date: CalendarDate) => void;
}

export function CalendarCell({
  date,
  isThursday,
  person,
  isCurrentMonth,
  isToday,
  isFocused,
  isSelected,
  isPast,
  onSelect,
}: CalendarCellProps) {
  return (
    <div
      className={`relative w-full h-full min-h-[60px] p-1 cursor-pointer
        ${!isCurrentMonth ? "text-gray-400" : ""}
        ${isToday ? "font-bold" : ""}
        ${isThursday && isCurrentMonth && !isPast ? "bg-blue-50" : ""}
        ${isThursday && isCurrentMonth && isPast ? "bg-gray-100" : ""}
        ${isFocused ? "ring-2 ring-blue-400" : ""}
        ${isSelected ? "ring-2 ring-green-500" : ""}
      `}
      onClick={() => onSelect(date)}
    >
      <div
        className={`absolute top-1.5 left-1.5 text-xs ${
          isToday ? "bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center" : ""
        }`}
      >
        {date.day}
      </div>

      {person && isThursday && (
        <div className="absolute bottom-1 left-1 right-1 text-xs overflow-hidden text-ellipsis">
          <div
            className={`${
              isSelected 
                ? "bg-green-100 text-green-800" 
                : isPast 
                  ? "bg-gray-200 text-gray-700" 
                  : "bg-blue-100 text-blue-800"
            } rounded-sm px-1 py-0.5 text-center truncate`}
          >
            {person.name}
            {isPast && " ✓"}
          </div>
        </div>
      )}
    </div>
  );
} 