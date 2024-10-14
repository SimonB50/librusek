import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { authenticate } from "@/lib/auth";
import { getUser } from "@/lib/user";
import { useState } from "react";

const Auth = () => {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    setAuthLoading(true);
    localStorage.setItem("login", data.login);
    localStorage.setItem("password", data.password);
    const userData = await getUser();
    if (userData) return router.push("/");
    const authenticated = await authenticate();
    if (authenticated && !authenticated.error) return router.push("/");
    setError(authenticated);
    setAuthLoading(false);
  };
  const onError = (errors, e) => console.error(errors, e);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      <div className="flex flex-col gap-4 rounded-box bg-base-200 p-6 w-full max-w-md">
        <h1 className="text-3xl font-bold self-center text-center">
          Login to Synergia
        </h1>
        <label className="form-control">
          <div className="label">
            <span className="label-text">Login</span>
          </div>
          <input
            className="input input-bordered"
            defaultValue={localStorage.getItem("login")}
            {...register("login", { required: true })}
          />
        </label>
        <label className="form-control">
          <div className="label">
            <span className="label-text">Password</span>
          </div>
          <input
            type="password"
            className="input input-bordered"
            defaultValue={localStorage.getItem("password")}
            {...register("password", { required: true })}
          />
        </label>
        {error && (
          <div className="rounded-box border border-error text-error p-4">
            {error.error === "invalidUser" &&
              "Your account has expired. Please contact the school administrator."}
            {error.error === "invalidCredentials" &&
              "Invalid login and/or password. Please check your credentials and try again."}
            {error.error === "invalidCaptcha" &&
              "Invalid captcha. Please solve the captcha on the website and try again."}
            {error.error === "unknown" && "Unknown error. Librus API may be unavailable."}
          </div>
        )}
        <button
          className="btn btn-primary"
          onClick={handleSubmit(onSubmit, onError)}
          disabled={authLoading}
        >
          {authLoading ? "Loading..." : "Login"}
        </button>
      </div>
    </div>
  );
};
export default Auth;
