import React from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { LoginPage } from '../pages/LoginPage'
import { SignUpPage } from '../pages/SignUpPage'
import { AuthLayout } from '../components/layuot/AuthLayout'
import { NotFoundPage } from '../pages/NotFoundPage'

export const AuthRoutes = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="login" />} />
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignUpPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}