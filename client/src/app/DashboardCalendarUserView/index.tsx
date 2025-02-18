import React from 'react'
import CalendarHeader from '@/components/CalendarHeader'
import CalendarMainView from '@/components/CalendarUserMainView'

type Props = {}

const DashboardCalendarView = (props: Props) => {
  return (
    <div className=''>
     <CalendarHeader/>
     <CalendarMainView/>
      </div>
  )
}

export default DashboardCalendarView