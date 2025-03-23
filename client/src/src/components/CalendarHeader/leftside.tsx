"use client"

import React from 'react'
import { Button } from '../ui/button'
import { Calendar, Menu } from 'lucide-react'
import Image from 'next/image'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { useDateStore, useToggleSideBarStore, useViewStore } from '@/lib/store'
import dayjs from 'dayjs'



export default function Headerleft() {
  const todaysDate = dayjs();
  const { userSelectedDate, setDate, setMonth, selectedMonthIndex } =
    useDateStore();
    const { setSideBarOpen } = useToggleSideBarStore();
    const { selectedView } = useViewStore();

    const handleTodayClick = () => {
      switch (selectedView) {
        case "month":
          setMonth(dayjs().month());
          break;
        case "week":
          setDate(todaysDate);
          break;
        case "day":
          setDate(todaysDate);
          setMonth(dayjs().month());
          break;
        default:
          break;
      }
    };

    const handlePrevClick = () => {
      switch (selectedView) {
        case "month":
          setMonth(selectedMonthIndex - 1);
          break;
        case "week":
          setDate(userSelectedDate.subtract(1, "week"));
          break;
        case "day":
          setDate(userSelectedDate.subtract(1, "day"));
          break;
        default:
          break;
      }
    };
  
    const handleNextClick = () => {
      switch (selectedView) {
        case "month":
          setMonth(selectedMonthIndex + 1);
          break;
        case "week":
          setDate(userSelectedDate.add(1, "week"));
          break;
        case "day":
          setDate(userSelectedDate.add(1, "day"));
          break;
        default:
          break;
      }
    };
  

  return (
    <div className='flex items-center gap-3'>
   <div className="hidden items-center lg:flex dark:text-gray-200">
  <Button variant="ghost" className='rounded-full p-2 dark:text-gray-200'  onClick={() => setSideBarOpen()}>
    <Calendar className="size-6"/>
  </Button>
  {/* <Image
  src={'wtn-logo-black.svg'} width={40} height={30} alt='icon'/> */}
  
   </div>

         {/* Today Button */}
   <Button variant="outline" onClick={handleTodayClick} className='dark:text-gray-200 dark:border-gray-400'>
        Today
      </Button>
    {/* Navigation Controls */}
    <div className="flex items-center gap-3 dark:text-gray-200">
        <MdKeyboardArrowLeft
          className="size-6 cursor-pointer font-bold"
          onClick={handlePrevClick}
        />
        <MdKeyboardArrowRight
          className="size-6 cursor-pointer font-bold"
          onClick={handleNextClick}
        />
      </div>

          {/* Current Month and Year Display */}
          <h1 className="hidden text-xl lg:block dark:text-gray-200">
        {dayjs(new Date(dayjs().year(), selectedMonthIndex)).format(
          "MMMM YYYY",
        )}
      </h1>
      </div>
  )
}
