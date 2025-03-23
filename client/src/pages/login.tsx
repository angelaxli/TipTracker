import { LoginForm } from "@/components/auth/LoginForm";

export default function Login() {  
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <LoginForm />
    </div>
  );
}
