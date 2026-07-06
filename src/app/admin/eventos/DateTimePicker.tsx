// src/app/admin/eventos/DateTimePicker.tsx
"use client";

import { useState, useEffect, useRef } from "react";

interface DateTimePickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  label: string;
  error?: string;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS_OF_WEEK = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

// Helper to get days in a month
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get start day of a month (0: Sunday, ..., 6: Saturday)
// We adjust it so that Monday is 0, ..., Sunday is 6
function getStartDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function DateTimePicker({ value, onChange, label, error }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Internal local date state (all operations in client's local timezone)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    // Default to tomorrow at 18:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    return tomorrow;
  });

  // Calendar navigation state (month/year view)
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  // Hours (00-23) and Minutes (00-59 in steps of 5)
  const hoursList = Array.from({ length: 24 }, (_, i) => i);
  const minutesList = Array.from({ length: 12 }, (_, i) => i * 5);

  const hoursContainerRef = useRef<HTMLDivElement>(null);
  const minutesContainerRef = useRef<HTMLDivElement>(null);

  // Sync state if value changes from outside
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        // Only shift the calendar view if the picker is closed to avoid shifting while the user is choosing
        if (!isOpen) {
          setCurrentMonth(d.getMonth());
          setCurrentYear(d.getFullYear());
        }
      }
    }
  }, [value, isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Center active scroll elements when picker opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        centerScrollItem(hoursContainerRef.current, selectedDate.getHours());
        const minIdx = Math.round(selectedDate.getMinutes() / 5) % 12;
        centerScrollItem(minutesContainerRef.current, minIdx);
      }, 50);
    }
  }, [isOpen, selectedDate]);

  const centerScrollItem = (container: HTMLDivElement | null, index: number) => {
    if (!container) return;
    const item = container.children[index] as HTMLElement;
    if (item) {
      container.scrollTo({
        top: item.offsetTop - container.offsetTop - (container.clientHeight / 2) + (item.clientHeight / 2),
        behavior: "auto"
      });
    }
  };

  // Triggers the form's onChange by converting our local selectedDate to UTC string
  const updateValue = (newDate: Date) => {
    setSelectedDate(newDate);
    onChange(newDate.toISOString());
  };

  // Day Selection Handler
  const handleDaySelect = (day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(currentYear);
    newDate.setMonth(currentMonth);
    newDate.setDate(day);
    updateValue(newDate);
  };

  // Hour Selection Handler (via click/tap)
  const handleHourSelect = (hour: number) => {
    const newDate = new Date(selectedDate);
    newDate.setHours(hour);
    updateValue(newDate);
    centerScrollItem(hoursContainerRef.current, hour);
  };

  // Minute Selection Handler (via click/tap)
  const handleMinuteSelect = (minuteIdx: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMinutes(minuteIdx * 5);
    updateValue(newDate);
    centerScrollItem(minutesContainerRef.current, minuteIdx);
  };

  // Scroll event listeners to support swipe on touch/mobile
  const handleScroll = (type: "hours" | "minutes", container: HTMLDivElement) => {
    const containerHeight = container.clientHeight;
    const center = container.scrollTop + (containerHeight / 2);
    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(container.children).forEach((child, index) => {
      const el = child as HTMLElement;
      const elCenter = el.offsetTop - container.offsetTop + (el.clientHeight / 2);
      const distance = Math.abs(center - elCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    const newDate = new Date(selectedDate);
    if (type === "hours") {
      if (newDate.getHours() !== closestIndex) {
        newDate.setHours(closestIndex);
        setSelectedDate(newDate);
        onChange(newDate.toISOString());
      }
    } else {
      const selectedMin = closestIndex * 5;
      if (newDate.getMinutes() !== selectedMin) {
        newDate.setMinutes(selectedMin);
        setSelectedDate(newDate);
        onChange(newDate.toISOString());
      }
    }
  };

  // Short-cuts select
  const selectShortcut = (type: "today" | "tomorrow_morning" | "tomorrow_evening" | "saturday") => {
    const now = new Date();
    const shortcut = new Date();
    
    if (type === "today") {
      shortcut.setHours(now.getHours() + 2, 0, 0, 0); // Today +2 hours
    } else if (type === "tomorrow_morning") {
      shortcut.setDate(now.getDate() + 1);
      shortcut.setHours(10, 0, 0, 0); // Tomorrow 10:00 AM
    } else if (type === "tomorrow_evening") {
      shortcut.setDate(now.getDate() + 1);
      shortcut.setHours(18, 0, 0, 0); // Tomorrow 6:00 PM
    } else if (type === "saturday") {
      const nextSat = new Date();
      nextSat.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));
      nextSat.setHours(15, 0, 0, 0); // Next Saturday 15:00
      shortcut.setTime(nextSat.getTime());
    }

    setCurrentMonth(shortcut.getMonth());
    setCurrentYear(shortcut.getFullYear());
    updateValue(shortcut);
  };

  // Calendar rendering math
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const startDay = getStartDayOfMonth(currentYear, currentMonth);
  
  // Previous month padding days
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  const prevMonthDays = Array.from(
    { length: startDay },
    (_, i) => daysInPrevMonth - startDay + i + 1
  );

  // Current month days
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Next month padding days to fill 6 rows (42 days total)
  const totalDaysDisplayed = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDays = Array.from(
    { length: 42 - totalDaysDisplayed },
    (_, i) => i + 1
  );

  const prevMonthHandler = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonthHandler = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Natural language description formatting in Spanish
  const getNaturalLanguageText = () => {
    if (!value) return "No se ha seleccionado fecha aún.";
    const now = new Date();
    
    // Reset times to compare dates only
    const dDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const nDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = dDate.getTime() - nDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const hoursStr = selectedDate.getHours().toString().padStart(2, "0");
    const minutesStr = selectedDate.getMinutes().toString().padStart(2, "0");
    const dayName = selectedDate.toLocaleDateString("es-ES", { weekday: "long" });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const monthName = selectedDate.toLocaleDateString("es-ES", { month: "long" });

    let timeRelative = "";
    if (diffDays === 0) timeRelative = "hoy";
    else if (diffDays === 1) timeRelative = "mañana";
    else if (diffDays === -1) timeRelative = "ayer";
    else if (diffDays > 1) timeRelative = `en ${diffDays} días`;
    else if (diffDays < -1) timeRelative = `hace ${Math.abs(diffDays)} días`;

    return `📅 ${capitalizedDay}, ${selectedDate.getDate()} de ${monthName} a las ${hoursStr}:${minutesStr} hs (${timeRelative})`;
  };

  // Formatter for main display input
  const getFormattedValue = () => {
    if (!value) return "Seleccionar fecha y hora...";
    
    const day = selectedDate.getDate().toString().padStart(2, "0");
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
    const year = selectedDate.getFullYear();
    const hours = selectedDate.getHours().toString().padStart(2, "0");
    const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
    
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  const isTodaySelected = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  };

  const isDaySelected = (day: number) => {
    return selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="text-[10px] font-bold uppercase tracking-wider text-brand-sky/80 block mb-1.5">
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] px-3.5 rounded-xl bg-brand-navy/60 border text-sm flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-brand-sky ${
          isOpen ? "border-brand-sky text-white" : error ? "border-rose-500/50 text-white/90" : "border-brand-blue/30 text-white/90 hover:border-brand-sky/40"
        }`}
      >
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 transition-colors ${isOpen ? "text-brand-sky" : "text-brand-sky/60"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={value ? "font-semibold text-white" : "text-brand-sky/35"}>
            {getFormattedValue()}
          </span>
        </div>
        <svg className={`w-4 h-4 transition-transform duration-200 text-white/40 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {error && (
        <p className="text-[10px] text-rose-500 font-semibold mt-1" role="alert">
          {error}
        </p>
      )}

      {/* Date Time Picker Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 md:left-auto md:right-0 mt-2 p-4 rounded-2xl bg-brand-navy border border-brand-blue/30 shadow-2xl z-50 flex flex-col gap-4 w-full md:w-[350px] animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Shortcuts section */}
          <div className="grid grid-cols-2 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => selectShortcut("today")}
              className="py-1.5 px-2 bg-brand-blue/20 hover:bg-brand-blue/40 border border-brand-blue/15 text-[10px] font-bold text-white rounded-lg transition-colors"
            >
              Hoy +2h
            </button>
            <button
              type="button"
              onClick={() => selectShortcut("tomorrow_morning")}
              className="py-1.5 px-2 bg-brand-blue/20 hover:bg-brand-blue/40 border border-brand-blue/15 text-[10px] font-bold text-white rounded-lg transition-colors"
            >
              Mañana 10:00
            </button>
            <button
              type="button"
              onClick={() => selectShortcut("tomorrow_evening")}
              className="py-1.5 px-2 bg-brand-blue/20 hover:bg-brand-blue/40 border border-brand-blue/15 text-[10px] font-bold text-white rounded-lg transition-colors"
            >
              Mañana 18:00
            </button>
            <button
              type="button"
              onClick={() => selectShortcut("saturday")}
              className="py-1.5 px-2 bg-brand-blue/20 hover:bg-brand-blue/40 border border-brand-blue/15 text-[10px] font-bold text-white rounded-lg transition-colors"
            >
              Sáb 15:00
            </button>
          </div>

          <div className="h-px bg-brand-blue/10 shrink-0" />

          {/* Calendar Block */}
          <div className="flex flex-col gap-2.5">
            {/* Header: Month & Year Selector */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={prevMonthHandler}
                className="w-7 h-7 rounded-lg hover:bg-brand-blue/20 flex items-center justify-center text-brand-sky border border-brand-blue/10 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs font-bold text-white tracking-tight">
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={nextMonthHandler}
                className="w-7 h-7 rounded-lg hover:bg-brand-blue/20 flex items-center justify-center text-brand-sky border border-brand-blue/10 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Days of Week headers */}
              {DAYS_OF_WEEK.map(d => (
                <span key={d} className="text-[10px] font-bold text-brand-sky/40 py-1">
                  {d}
                </span>
              ))}

              {/* Prev Month padding days */}
              {prevMonthDays.map((d, i) => (
                <span key={`prev-${i}`} className="text-[10px] font-semibold text-zinc-600/40 p-1 select-none">
                  {d}
                </span>
              ))}

              {/* Current Month days */}
              {currentMonthDays.map(d => {
                const selected = isDaySelected(d);
                const today = isTodaySelected(d);
                return (
                  <button
                    key={`curr-${d}`}
                    type="button"
                    onClick={() => handleDaySelect(d)}
                    className={`text-[10px] font-bold rounded-lg p-1.5 transition-all active:scale-90 flex items-center justify-center relative ${
                      selected
                        ? "bg-brand-sky text-brand-navy font-black shadow-md shadow-brand-sky/15"
                        : today
                          ? "bg-brand-blue/30 border border-brand-sky/30 text-brand-sky"
                          : "text-white/80 hover:bg-brand-blue/15"
                    }`}
                  >
                    {d}
                    {today && !selected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-sky" />
                    )}
                  </button>
                );
              })}

              {/* Next Month padding days */}
              {nextMonthDays.map((d, i) => (
                <span key={`next-${i}`} className="text-[10px] font-semibold text-zinc-600/40 p-1 select-none">
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="h-px bg-brand-blue/10 shrink-0" />

          {/* Time Picker Block: Vertical Scrolls / Cylindrical effect */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-bold text-brand-sky/60 uppercase tracking-wider px-1">
              Hora del Evento
            </span>
            
            <div className="flex gap-4 items-center justify-center p-2 rounded-xl bg-brand-dark/40 border border-brand-blue/10">
              
              {/* Hour Scroll Column */}
              <div className="flex flex-col items-center flex-1">
                <span className="text-[9px] font-bold text-white/30 mb-1">Hora</span>
                <div className="relative w-full h-24 overflow-hidden rounded-lg bg-brand-navy/60 border border-brand-blue/15">
                  {/* Wheel Shading Effects */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-brand-navy via-brand-navy/70 to-transparent pointer-events-none z-10" />
                  <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-transparent pointer-events-none z-10" />
                  <div className="absolute inset-y-8 inset-x-1.5 border-y border-brand-sky/20 pointer-events-none" />
                  
                  <div
                    ref={hoursContainerRef}
                    onScroll={(e) => handleScroll("hours", e.currentTarget)}
                    className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-8 px-1 scroll-smooth"
                  >
                    {hoursList.map(h => {
                      const isSelected = selectedDate.getHours() === h;
                      return (
                        <div
                          key={`hour-${h}`}
                          onClick={() => handleHourSelect(h)}
                          className={`snap-center h-8 flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                            isSelected ? "text-brand-sky scale-110 font-black" : "text-white/30 hover:text-white/60"
                          }`}
                        >
                          {h.toString().padStart(2, "0")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <span className="text-sm font-bold text-white/20 pt-4">:</span>

              {/* Minute Scroll Column */}
              <div className="flex flex-col items-center flex-1">
                <span className="text-[9px] font-bold text-white/30 mb-1">Minuto</span>
                <div className="relative w-full h-24 overflow-hidden rounded-lg bg-brand-navy/60 border border-brand-blue/15">
                  {/* Wheel Shading Effects */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-brand-navy via-brand-navy/70 to-transparent pointer-events-none z-10" />
                  <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-transparent pointer-events-none z-10" />
                  <div className="absolute inset-y-8 inset-x-1.5 border-y border-brand-sky/20 pointer-events-none" />

                  <div
                    ref={minutesContainerRef}
                    onScroll={(e) => handleScroll("minutes", e.currentTarget)}
                    className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-8 px-1 scroll-smooth"
                  >
                    {minutesList.map((m, idx) => {
                      const isSelected = selectedDate.getMinutes() === m;
                      return (
                        <div
                          key={`minute-${m}`}
                          onClick={() => handleMinuteSelect(idx)}
                          className={`snap-center h-8 flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                            isSelected ? "text-brand-sky scale-110 font-black" : "text-white/30 hover:text-white/60"
                          }`}
                        >
                          {m.toString().padStart(2, "0")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="h-px bg-brand-blue/10 shrink-0" />

          {/* Natural Language Preview / Confirm */}
          <div className="flex flex-col gap-2.5 shrink-0">
            <p className="text-[10px] leading-relaxed text-brand-sky font-semibold bg-brand-sky/10 border border-brand-sky/15 p-2 rounded-xl text-center">
              {getNaturalLanguageText()}
            </p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full min-h-[38px] rounded-xl bg-brand-sky hover:bg-brand-sky/90 active:scale-95 text-brand-navy text-xs font-black shadow-lg shadow-brand-sky/10 transition-all flex items-center justify-center"
            >
              Confirmar Fecha
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
