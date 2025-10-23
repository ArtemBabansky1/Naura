import React from 'react'
import { Outlet } from 'react-router'

export const AuthLayout = () => {
  return (
    <div>
        <Outlet />
    </div>
  )
}
