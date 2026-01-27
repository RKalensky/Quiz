import { NavLink } from "react-router";

export default () => {
  return (
    <div className="fixed bottom-[25px] right-[25px]">
      <NavLink to="/">
        <button>На головну</button>
      </NavLink>
    </div>
  );
};
