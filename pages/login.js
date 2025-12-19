import Link from "next/link";
import ToastMessage from "@/components/ToastMessage";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { auth } from "@/firebase/firebase";
import { IoLogoGoogle, IoLogoFacebook } from "react-icons/io";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import Loader from "@/components/Loader";

const Login = () => {
  const { currentUser, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const router = useRouter();

  const gProvider = new GoogleAuthProvider();
  const fProvider = new FacebookAuthProvider();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace("/");
    }
  }, [currentUser, isLoading, router]);

  // Email / Password Login
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Google Login
  const signWithGoogle = async () => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log("LOGIN SUCCESS:", cred.user);
      router.replace("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Facebook Login
  const signWithFacebook = async () => {
    try {
      await signInWithPopup(auth, fProvider);
      router.replace("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Reset Password
  const resetPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    try {
      toast.promise(
        sendPasswordResetEmail(auth, email),
        {
          pending: "Generating reset link...",
          success: "Reset email sent successfully",
          error: "Failed to send reset email",
        },
        { autoClose: 5000 }
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Loader while auth state resolves
  if (isLoading || currentUser) {
    return <Loader />;
  }

  return (
    <div className="h-[100vh] flex justify-center items-center bg-c1">
      <ToastMessage />

      <div className="flex items-center flex-col">
        {/* Heading */}
        <div className="text-center">
          <div className="text-4xl font-medium">Login to Your Account</div>
          <div className="mt-3 text-c3">
            Connect and Chat with your Nears & Dears
          </div>
        </div>

        {/* Social Login */}
        <div className="flex items-center gap-2 w-full mt-10 mb-5">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-1/2 h-14 rounded-md cursor-pointer p-[1px]"
            onClick={signWithGoogle}
          >
            <div className="flex items-center justify-center gap-3 text-white font-medium bg-c1 w-full h-full rounded-md">
              <IoLogoGoogle size={25} />
              <span>Login with Google</span>
            </div>
          </div>

          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-1/2 h-14 rounded-md cursor-pointer p-[1px]"
            onClick={signWithFacebook}
          >
            <div className="flex items-center justify-center gap-3 text-white font-medium bg-c1 w-full h-full rounded-md">
              <IoLogoFacebook size={25} />
              <span>Login with Facebook</span>
            </div>
          </div>
        </div>

        {/* OR */}
        <div className="flex items-center gap-1">
          <span className="w-5 h-[1px] bg-c3" />
          <span className="text-c3 font-semibold">OR</span>
          <span className="w-5 h-[1px] bg-c3" />
        </div>

        {/* Login Form */}
        <form
          className="flex flex-col items-center gap-3 w-[500px] mt-5"
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            name="email" // ✅ FIXED
            placeholder="Enter your email"
            autoComplete="off"
            className="w-full h-14 bg-c5 rounded-xl outline-none border-none px-5 text-c3"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            name="password" // ✅ FIXED
            placeholder="Enter your password"
            autoComplete="off"
            className="w-full h-14 bg-c5 rounded-xl outline-none border-none px-5 text-c3"
          />

          <div className="text-right w-full text-c3">
            <span className="cursor-pointer" onClick={resetPassword}>
              Forgot Password?
            </span>
          </div>

          <button
            type="submit"
            className="mt-4 w-full h-14 rounded-xl outline-none text-base font-medium
            bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
          >
            Login to Your Account
          </button>
        </form>

        {/* Register */}
        <div className="flex justify-center gap-1 text-c3 mt-5">
          <span>Not a member yet?</span>
          <Link
            href="/register"
            className="font-medium text-white underline underline-offset-2 cursor-pointer"
          >
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
