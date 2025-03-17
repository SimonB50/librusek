import { useRouter } from "next/router";

import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Key, Person, Trash } from "react-bootstrap-icons";

import { authenticate } from "@/lib/auth";

const Auth = () => {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const { register, handleSubmit, watch, setValue, resetField } = useForm();

  const onSubmit = async (data) => {
    setAuthLoading(true);
    const { login, password, nickname } = data;
    const authenticated = await authenticate(login, password);
    if (!authenticated || authenticated.error) {
      setError(authenticated);
      return setAuthLoading(false);
    }
    if (nickname) {
      const currentAccounts = savedAccounts;
      const account = {
        login,
        password: btoa(password),
        nickname,
      };
      const accountIndex = currentAccounts.findIndex(
        (acc) => acc.login === login
      );
      if (accountIndex >= 0) currentAccounts.splice(accountIndex, 1);
      currentAccounts.push(account);
      await SecureStoragePlugin.set({
        key: "accounts",
        value: JSON.stringify(currentAccounts),
      });
    }
    sessionStorage.clear();
    await router.push("/");
  };
  const onError = (errors, e) => console.error(errors, e);

  useEffect(() => {
    SecureStoragePlugin.get({ key: "accounts" }).then((res) => {
      if (res.value)
        setSavedAccounts((old) => [...old, ...JSON.parse(res.value)]);
    });
  }, []);

  return (
    <>
      <dialog
        id="accounts_modal"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">Saved Accounts</h3>
          <p className="py-4">
            Select one of your saved accounts to login to Synergia.
          </p>
          <div className="flex flex-col gap-2">
            {savedAccounts?.map((account) => (
              <div
                key={account.login}
                className="flex flex-row items-center justify-between gap-2"
              >
                <button
                  className="btn btn-primary grow shrink flex-wrap"
                  onClick={() => {
                    document.getElementById("save_account_checkbox").checked =
                      true;
                    setValue("login", account.login);
                    setValue("password", atob(account.password));
                    document.getElementById("accounts_modal").close();
                  }}
                >
                  {account.nickname || account.login}
                </button>
                <button
                  className="btn btn-error items-center justify-center shrink-0"
                  onClick={() => {
                    setSavedAccounts((prev) =>
                      prev.filter((acc) => acc !== account)
                    );
                  }}
                >
                  <Trash className="text-error-content text-md" />
                </button>
              </div>
            )) || <p>No accounts saved.</p>}
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog id="save_account" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Save your account</h3>
          <p className="py-4">
            Please provide a name for your account to save it for future use.
          </p>
          <label className="fieldset">
            <legend className="fieldset-legend">Account nickname</legend>
            <input
              className="input w-full validator"
              {...register("nickname", { required: false })}
            />
          </label>
          <div className="modal-action">
            <form method="dialog" className="flex flex-row gap-2">
              <button
                className="btn"
                onClick={() => {
                  document.getElementById("save_account_checkbox").checked =
                    false;
                  resetField("nickname");
                }}
              >
                Close
              </button>
              {watch("nickname") && (
                <button className="btn btn-primary">Save</button>
              )}
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button
            onClick={() => {
              document.getElementById("save_account_checkbox").checked = false;
              resetField("nickname");
            }}
          >
            close
          </button>
        </form>
      </dialog>
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-base-200 relative">
        <div className="flex flex-col gap-4 rounded-box p-6 w-full max-w-md">
          <h1 className="text-3xl font-bold self-center text-center">
            Login to Synergia
          </h1>
          <form id="login_form" onSubmit={handleSubmit(onSubmit, onError)}>
            <label className="fieldset">
              <legend className="fieldset-legend">Login</legend>
              <input
                className="input w-full validator"
                autoComplete="username"
                required
                {...register("login", { required: true })}
              />
            </label>
            <label className="fieldset">
              <legend className="fieldset-legend">Password</legend>
              <input
                type="password"
                className="input w-full validator"
                autoComplete="current-password"
                required
                {...register("password", { required: true })}
              />
            </label>
            <div className="fieldset">
              <label className="fieldset-label cursor-pointer self-start gap-2">
                <input
                  id="save_account_checkbox"
                  type="checkbox"
                  className="checkbox"
                  onClick={(e) => {
                    if (e.target.checked)
                      document.getElementById("save_account").showModal();
                    else resetField("nickname");
                  }}
                />
                Save this account
              </label>
            </div>
          </form>
          {error && (
            <div className="rounded-box border border-error text-error p-4">
              {error.error === "invalidUser" &&
                "Your account has expired. Please contact the school administrator."}
              {error.error === "invalidCredentials" &&
                "Invalid login and/or password. Please check your credentials and try again."}
              {error.error === "invalidCaptcha" &&
                "Invalid captcha. Please solve the captcha on the website and try again."}
              {error.error === "unknown" &&
                "Unknown error. Librus API may be unavailable."}
            </div>
          )}
          <button
            type="submit"
            form="login_form"
            className="btn btn-primary"
            disabled={authLoading}
          >
            {authLoading ? (
              <>Loading...</>
            ) : (
              <>
                <Key className="text-2xl text-primary-content" /> Login
              </>
            )}
          </button>
          <div className="divider my-1">OR</div>
          <button
            className="btn btn-primary"
            onClick={() =>
              document.getElementById("accounts_modal").showModal()
            }
          >
            <Person className="text-2xl text-primary-content" /> Saved accounts
          </button>
        </div>
      </div>
    </>
  );
};
export default Auth;
