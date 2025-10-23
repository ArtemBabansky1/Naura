import React from 'react'
import { PageWrapper } from '../components/PageWrapper'

export const NotFoundPage = () => {
  return (
    <PageWrapper>
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-lg">Page not found</p>
      </div>
    </PageWrapper>
  )
}