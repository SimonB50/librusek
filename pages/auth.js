import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { authenticate } from "@/lib/auth";
import { getUser } from "@/lib/user";
import { useState, useEffect } from "react";

const Auth = () => {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    setAuthLoading(true);
    localStorage.setItem("login", data.login);
    localStorage.setItem("password", data.password);
    const userData = await getUser();
    if (userData) return router.push("/");
    const authenticated = await authenticate();
    if (authenticated) return router.push("/");
    setAuthLoading(false);
  };
  const onError = (errors, e) => console.error(errors, e);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      <div className="flex flex-col gap-4 rounded-box bg-base-200 p-6 w-full max-w-md">
        <h1 className="text-3xl font-bold self-center text-center">Login to Synergia</h1>
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
