import { createBrowserRouter, redirect } from "react-router";
import StumpComponent from "./pages/Stump";
import FourForFortyComponent from "./pages/FourForForty";
import FiveTenComponent from "./pages/FiveTen";
import WithHomeLink from "./components/WithHomeLink";
import Intro from "./pages/Intro";
import VariantsHost from "./pages/VariantsHost";
import VariantsPlay from "./pages/VariantsPlay";
import WhoAmIHost from "./pages/WhoAmIHost";
import WhoAmIPlay from "./pages/WhoAmIPlay";
import { getActivityData } from "./config/activities";
import type { FiveTen, FourForForty, Stump, VariantQuestion, WhoAmIQuestion } from "./types";

// Loader that returns the activity's data, or redirects home if game.json has
// no data for it (key removed or empty) — so disabled activities can't be
// reached even by direct URL.
const requireActivity =
  <T,>(key: string) =>
  (): T => {
    const data = getActivityData<T>(key);
    if (!data) throw redirect("/");
    return data;
  };

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Intro,
  },
  {
    path: "/stump",
    Component: WithHomeLink(StumpComponent),
    loader: requireActivity<Stump[]>("stump"),
  },
  {
    path: "/four-for-forty",
    Component: WithHomeLink(FourForFortyComponent),
    loader: requireActivity<FourForForty>("FourForForty"),
  },
  {
    path: "/five-ten",
    Component: WithHomeLink(FiveTenComponent),
    loader: requireActivity<FiveTen>("fiveTen"),
  },
  {
    path: "/variants",
    Component: WithHomeLink(VariantsHost),
    loader: requireActivity<VariantQuestion[]>("variants"),
  },
  {
    path: "/play",
    Component: VariantsPlay,
  },
  {
    path: "/whoami",
    Component: WithHomeLink(WhoAmIHost),
    loader: requireActivity<WhoAmIQuestion[]>("whoami"),
  },
  {
    path: "/buzz",
    Component: WhoAmIPlay,
  },
]);
