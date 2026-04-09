import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="text-8xl font-black text-primary/10 mb-4">404</div>
        <h1 className="text-2xl font-black text-primary mb-3">
          Page not found
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary" className="font-bold"
            asChild
          >
            <Link to="/">Go to home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}