import { NavLink } from "react-router";

export default () => {
  return (
    <div>
      <h1>
        Інтерактивна вікторина. Потрібно поділитися на дві команди. Гра
        складається з чотирьох раундів. В кожному учасники можуть отримати бали.
        В кінці буде приз, той, що ніхто собі ніколи не купить.
      </h1>

      <nav className="flex gap-6">
        <NavLink to="/stump">
          <button>Підстава</button>
        </NavLink>
        <NavLink to="/five-ten">
          <button>П'яте-десяте</button>
        </NavLink>
        <NavLink to="/four-for-forty">
          <button>Чотири за сорок</button>
        </NavLink>
      </nav>

      <p className="absolute bottom-[40px] text-2xl">
        Note: Усі спірні відповіді будуть перевірятися чатом ГПТ.
      </p>
    </div>
  );
};
