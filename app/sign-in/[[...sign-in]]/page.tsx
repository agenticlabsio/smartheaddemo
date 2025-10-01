import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to FinSight</h1>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
              card: 'shadow-lg border border-gray-200',
            }
          }}
          forceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}