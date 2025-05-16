import { useRedirectIfAuth } from "@/lib/auth";
import { Link } from "wouter";
import RegisterForm from "@/components/auth/RegisterForm";

export default function Register() {
  useRedirectIfAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/">
          <h1 className="text-primary-800 font-heading font-bold text-3xl cursor-pointer">HomeFixr</h1>
        </Link>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">Create a new account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Join our platform as a homeowner or contractor
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
}
