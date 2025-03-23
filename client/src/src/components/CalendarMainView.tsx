"use client"
import React from 'react'
import MonthView from './month-view'
import SideBar from './CalendarSidebar/SideBar'
import { useDateStore, useEventStore, useViewStore } from '@/lib/store'
import WeekView from './week-view'
import DayView from './day-view'
import EventPopover from './event-popover'
import { EventSummaryPopover } from './event-summary-popover'


export default function CalendarMainView() {
  const {selectedView} = useViewStore()
  const {
    isPopoverOpen,
    closePopover,
    isEventSummaryOpen,
    closeEventSummary,
    selectedEvent,
    setEvents,
  } = useEventStore();

  const { userSelectedDate } = useDateStore();

  return (
    <div className='flex'>
        <SideBar/>
       <div className="w-full flex-1">
        { selectedView === "day" && <DayView/>}
        {/* { selectedView === "week" && <WeekView/>} */}
        {/* { selectedView === "month" && <MonthView/>} */}
       </div>
       {isPopoverOpen && (
        <EventPopover
          isOpen={isPopoverOpen}
          onClose={closePopover}
          // date={userSelectedDate.format("YYYY-MM-DD")}
        />
      )}
        {isEventSummaryOpen && selectedEvent && (
        <EventSummaryPopover
          isOpen={isEventSummaryOpen}
          onClose={closeEventSummary}
          event={selectedEvent}
        />
      )}
        </div>
  )
}
