import { createBrowserRouter } from "react-router";
import StumpComponent from "./pages/Stump";
import FourForFortyComponent from "./pages/FourForForty";
import FiveTenComponent from "./pages/FiveTen";
import GoHome from "./components/GoHome";
import Intro from "./pages/Intro";
import game from "./config/game.json";
import type { FiveTen, FourForForty, Stump } from "./types";

const WithHomeLink = (Component: React.ComponentType) => {
  return () => (
    <div>
      <GoHome />
      <Component />
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Intro,
  },
  {
    path: "/stump",
    Component: WithHomeLink(StumpComponent),
    loader: (): Stump[] => game.stump,
  },
  {
    path: "/four-for-forty",
    Component: WithHomeLink(FourForFortyComponent),
    loader: (): FourForForty => game.FourForForty,
  },
  {
    path: "/five-ten",
    Component: WithHomeLink(FiveTenComponent),
    loader: (): FiveTen => game.fiveTen,
  },
]);
