import { NavLink } from "react-router";

const HomeLink = () => {
  return (
    <div className="fixed bottom-[25px] right-[25px]">
      <NavLink to="/">
        <button>На головну</button>
      </NavLink>
    </div>
  );
};

export default HomeLink;
