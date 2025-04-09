import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const LinkComponent = ({ children, skipLocaleHandling, ...rest }) => {
  const router = useRouter();
  // const locale = rest.locale || router.query.locale || "";

  let href = rest.href || router.asPath;
  delete rest.href; // Remove href from rest props

  // // Skip locale handling for external links
  // if (href.indexOf("http") === 0) skipLocaleHandling = true;

  // // Ensure locale is only prepended if not already present
  // if (locale && !skipLocaleHandling) {
  //   const hrefLocaleRegex = new RegExp(`^/${locale}(/|$)`);
  //   if (!hrefLocaleRegex.test(href)) {
  //     href = `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
  //   }
  // }

  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
};

export default LinkComponent;
