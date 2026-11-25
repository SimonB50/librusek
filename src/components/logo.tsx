import logo from "../assets/logo.svg";

/** App logo (same artwork as the launcher icon and favicon). Decorative - the app name sits next to it. */
const Logo = ({className = "size-8"}: { className?: string }) => (
  <img src={logo} alt="" aria-hidden="true" className={`rounded-field shrink-0 ${className}`}/>
);

export default Logo;
