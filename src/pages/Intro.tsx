import { NavLink } from "react-router";
import { ACTIVITIES, hasActivityData } from "../config/activities";

export default () => {
  const activities = ACTIVITIES.filter((a) => hasActivityData(a.key));

  return (
    <div>
      <h1>
        Інтерактивна вікторина. Потрібно поділитися на дві команди. В кожному
        раунді учасники можуть отримати бали. В кінці буде приз, той, що ніхто
        собі ніколи не купить.
      </h1>

      <nav className="flex gap-6 flex-wrap">
        {activities.map((a) => (
          <NavLink key={a.path} to={a.path}>
            <button>{a.label}</button>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
