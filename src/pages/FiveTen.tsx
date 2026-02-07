import { useLoaderData } from "react-router";
import type { FiveTen } from "../types";
import Modal from "../components/Modal.tsx";
import { useState } from "react";

export default function FiveTenPage() {
  const data = useLoaderData() as FiveTen;
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [passedCategories, setPassedCategories] = useState<number[]>([]);

  const selectCategory = (index: number) => {
    setSelectedCategory(index);
    setPassedCategories((prev) => [...prev, index]);
  };

  if (!data?.length) {
    return <div>No data available</div>;
  }

  return (
    <div>
      <h1 className="text-center mb-60!">
        Раунд "П'яте - деcяте". Вам потрібно за десять секунд назвати п'ять
        чогось."
      </h1>

      <ul className="grid grid-cols-[repeat(8,100px)] grid-rows-2 gap-6 justify-self-center">
        {data.map((_, index) => (
          <li
            key={index}
            className={`
              shrink-0 justify-self-center w-25 h-25 border-2 border-white
              flex items-center justify-center text-5xl font-bold cursor-pointer hover:bg-gray-800
              ${passedCategories.includes(index) ? "opacity-10" : "opacity-100"}
            `}
            onClick={() => selectCategory(index)}
          >
            <strong>{index + 1}</strong>
          </li>
        ))}
      </ul>

      <Modal
        isOpen={selectedCategory !== null}
        title={`Категорія № ${selectedCategory! + 1}:`}
        children={<p className="text-7xl">Назви 5 {data[selectedCategory!]}</p>}
        onClose={() => setSelectedCategory(null)}
      />
    </div>
  );
}
