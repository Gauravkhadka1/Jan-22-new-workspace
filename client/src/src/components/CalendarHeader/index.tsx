import React from 'react'
import Headerleft from './leftside'
import HeaderRight from './rightside'

export default function calendarheader() {
  return (
    <div className='mx-3 flex items-center justify-between py-4'>
      <Headerleft/>
      <HeaderRight/>
      </div>
  )
}
