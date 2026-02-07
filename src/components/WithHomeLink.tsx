import { type ComponentType } from "react";
import GoHome from "./GoHome.tsx";

const WithHomeLink = (Component: ComponentType) => {
  return () => (
    <div>
      <GoHome />
      <Component />
    </div>
  );
};

export default WithHomeLink;
