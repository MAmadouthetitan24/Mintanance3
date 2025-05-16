import { useRedirectIfAuth } from "@/lib/auth";
import { Link } from "wouter";
import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
  useRedirectIfAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/">
          <h1 className="text-primary-800 font-heading font-bold text-3xl cursor-pointer">HomeFixr</h1>
        </Link>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Get access to your dashboard and jobs
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
