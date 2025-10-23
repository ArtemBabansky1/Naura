import React from 'react'
import { Navigate, Route } from 'react-router'
import { Routes } from 'react-router'
import { AppLayout } from '../components/layuot/AppLayout'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="home" />} />
      <Route element={<AppLayout />}>
        <Route path="home" element={<HomePage />} />
        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>
    </Routes>
  )
}
