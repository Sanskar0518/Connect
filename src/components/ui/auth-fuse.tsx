"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
    textArray.length,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-200"
);

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 text-white hover:text-white",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-zinc-400 underline-offset-4 hover:underline hover:text-white",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-3 text-sm text-white shadow-sm transition-shadow placeholder:text-zinc-500 focus-visible:border-zinc-700 focus-visible:ring-1 focus-visible:ring-zinc-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-zinc-400 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export interface SignInFormProps {
  onSubmit?: (email: string, password: string) => void;
  loading?: boolean;
  topSlot?: React.ReactNode;
}

export function SignInForm({ onSubmit, loading, topSlot }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(email, password);
    } else {
      console.log("UI: Sign In form submitted", { email, password });
    }
  };

  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to your account</h1>
        <p className="text-balance text-sm text-zinc-400">Enter your email below to sign in</p>
      </div>

      {topSlot}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <PasswordInput
          name="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Password"
        />
        <Button type="submit" variant="outline" className="mt-2 w-full font-medium" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Sign In"}
        </Button>
      </div>
    </form>
  );
}

export interface SignUpFormProps {
  onSubmit?: (name: string, email: string, password: string) => void;
  loading?: boolean;
  topSlot?: React.ReactNode;
}

export function SignUpForm({ onSubmit, loading, topSlot }: SignUpFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(name, email, password);
    } else {
      console.log("UI: Sign Up form submitted", { name, email, password });
    }
  };

  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Create an account</h1>
        <p className="text-balance text-sm text-zinc-400">Enter your details below to sign up</p>
      </div>

      {topSlot}

      <div className="grid gap-4">
        <div className="grid gap-1">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <PasswordInput
          name="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Password"
        />
        <Button type="submit" variant="outline" className="mt-2 w-full font-medium" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Sign Up"}
        </Button>
      </div>
    </form>
  );
}

export interface AuthFormContainerProps {
  isSignIn: boolean;
  onToggle: () => void;
  onSignInSubmit?: (email: string, password: string) => void;
  onSignUpSubmit?: (name: string, email: string, password: string) => void;
  onGoogleSignIn?: () => void;
  googleLoading?: boolean;
  loading?: boolean;
  topSlot?: React.ReactNode;
}

export function AuthFormContainer({
  isSignIn,
  onToggle,
  onSignInSubmit,
  onSignUpSubmit,
  onGoogleSignIn,
  googleLoading,
  loading,
  topSlot,
}: AuthFormContainerProps) {
  return (
    <div className="mx-auto grid w-full max-w-[350px] gap-2">
      {isSignIn ? (
        <SignInForm onSubmit={onSignInSubmit} loading={loading} topSlot={topSlot} />
      ) : (
        <SignUpForm onSubmit={onSignUpSubmit} loading={loading} topSlot={topSlot} />
      )}
      <div className="text-center text-sm text-zinc-400 mt-2">
        {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
        <Button variant="link" className="pl-1 text-white hover:underline font-semibold" onClick={onToggle}>
          {isSignIn ? "Sign up" : "Sign in"}
        </Button>
      </div>
      {isSignIn && (
        <>
          <div className="relative my-2 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-zinc-800">
            <span className="relative z-10 bg-black px-2 text-zinc-400 text-xs">Or continue with</span>
          </div>
          <Button
            variant="outline"
            type="button"
            onClick={onGoogleSignIn || (() => console.log("UI: Google button clicked"))}
            disabled={googleLoading || loading}
            className="w-full"
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>
        </>
      )}
    </div>
  );
}

export interface AuthContentProps {
  image?: {
    src: string;
    alt: string;
  };
  quote?: {
    text: string;
    author?: string;
  };
}

export interface AuthUIProps {
  signInContent?: AuthContentProps;
  signUpContent?: AuthContentProps;
  initialView?: "signin" | "signup";
  onToggle?: () => void;
  onSignInSubmit?: (email: string, password: string) => void;
  onSignUpSubmit?: (name: string, email: string, password: string) => void;
  onGoogleSignIn?: () => void;
  googleLoading?: boolean;
  loading?: boolean;
  topSlot?: React.ReactNode;
}

const defaultSignInContent = {
  image: {
    src: "/astronaut-login.jpg",
    alt: "A meditating astronaut surrounded by cosmic energy",
  },
  quote: {
    text: "Welcome Back! The journey continues.",
    author: "",
  },
};

const defaultSignUpContent = {
  image: {
    src: "/astronaut-signup.jpg",
    alt: "An astronaut floating freely in deep space",
  },
  quote: {
    text: "Create an account. A new chapter awaits.",
    author: "",
  },
};

export function AuthUI({
  signInContent = {},
  signUpContent = {},
  initialView = "signin",
  onToggle,
  onSignInSubmit,
  onSignUpSubmit,
  onGoogleSignIn,
  googleLoading,
  loading,
  topSlot,
}: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(initialView === "signin");

  useEffect(() => {
    setIsSignIn(initialView === "signin");
  }, [initialView]);

  const toggleForm = () => {
    if (onToggle) {
      onToggle();
    } else {
      setIsSignIn((prev) => !prev);
    }
  };

  const finalSignInContent = {
    image: { ...defaultSignInContent.image, ...signInContent.image },
    quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUpContent = {
    image: { ...defaultSignUpContent.image, ...signUpContent.image },
    quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2 bg-black text-white selection:bg-indigo-500 selection:text-white">
      {/* Form Section */}
      <div className="flex h-screen items-center justify-center p-6 md:h-auto md:p-0 md:py-12 bg-black">
        <AuthFormContainer
          isSignIn={isSignIn}
          onToggle={toggleForm}
          onSignInSubmit={onSignInSubmit}
          onSignUpSubmit={onSignUpSubmit}
          onGoogleSignIn={onGoogleSignIn}
          googleLoading={googleLoading}
          loading={loading}
          topSlot={topSlot}
        />
      </div>

      {/* Hero Astronaut Background Section */}
      <div
        className="hidden md:block relative bg-cover bg-center transition-all duration-500 ease-in-out bg-black"
        style={{ backgroundImage: `url(${currentContent.image.src})` }}
        key={currentContent.image.src}
      >
        <div className="absolute inset-x-0 bottom-0 h-[120px] bg-gradient-to-t from-black via-black/60 to-transparent" />

        <div className="relative z-10 flex h-full flex-col items-center justify-end p-4 pb-8">
          <blockquote className="space-y-2 text-center text-white drop-shadow-md">
            <p className="text-lg font-medium tracking-wide">
              “
              <Typewriter
                key={currentContent.quote.text}
                text={currentContent.quote.text}
                speed={60}
              />
              ”
            </p>
            {currentContent.quote.author ? (
              <cite className="block text-sm font-light text-zinc-400 not-italic">
                — {currentContent.quote.author}
              </cite>
            ) : null}
          </blockquote>
        </div>
      </div>
    </div>
  );
}

export default AuthUI;
