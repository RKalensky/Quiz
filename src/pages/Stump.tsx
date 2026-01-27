import { useLoaderData } from "react-router";
import type { Stump } from "../types";
import { useCallback, useMemo, useState } from "react";
import Modal from "../components/Modal.tsx";

export default function StumpPage() {
  const data = useLoaderData() as Stump[];
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedQuestionDifficulty, setSelectedQuestionDifficulty] = useState<
    keyof Pick<Stump, "easyQuestion" | "hardQuestion"> | null
  >(null);
  const [passedCategories, setPassedCategories] = useState<number[]>([]);

  const selectCategory = (index: number) => {
    setSelectedCategory(index);
    setPassedCategories((prev) => [...prev, index]);
  };

  const selectQuestionDifficulty = useCallback(
    (difficulty: "easyQuestion" | "hardQuestion") => {
      if (selectedCategory === null) return;

      setSelectedQuestionDifficulty(difficulty);
    },
    [selectedCategory],
  );

  const onModalClose = useCallback(() => {
    setSelectedCategory(null);
    setSelectedQuestionDifficulty(null);
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const modalContent = useMemo(() => {
    if (selectedCategory === null) {
      return null;
    }

    if (!selectedQuestionDifficulty) {
      return (
        <div>
          <p className="text-7xl mb-20 font-bold">
            Оберіть складність питання:
          </p>
          <div className="flex gap-10 justify-center">
            <button
              className="text-5xl! font-bold!"
              onClick={() => selectQuestionDifficulty("easyQuestion")}
            >
              Легке
            </button>
            <button
              className="text-5xl! font-bold!"
              onClick={() => selectQuestionDifficulty("hardQuestion")}
            >
              Складне
            </button>
          </div>
        </div>
      );
    }

    return (
      <p className="text-5xl font-bold leading-[1.2]">
        {data[selectedCategory][selectedQuestionDifficulty]}
      </p>
    );
  }, [
    data,
    selectedCategory,
    selectedQuestionDifficulty,
    selectQuestionDifficulty,
  ]);

  return (
    <div>
      <h1 className="text-6xl! mb-30!">
        Раунд "Підстава". Команда опонент обирає категорію та складність питання
        для іншої команди. Правильна відповідь на просте питання - 1 бал.
        Складне - 2 бали.
      </h1>

      <ul className="flex flex-wrap gap-7 justify-center">
        {data.map((item, index) => (
          <li
            key={index}
            className={`
              flex text-center items-center justify-center mb-10 text-3xl
              font-bold border border-white rounded-lg px-6 py-4 w-75 cursor-pointer hover:bg-gray-800
              ${passedCategories.includes(index) ? "opacity-10" : "opacity-100"}
            `}
            onClick={() => selectCategory(index)}
          >
            {item.category}
          </li>
        ))}
      </ul>

      <Modal
        isOpen={selectedCategory !== null}
        title={`Категорія: ${data[selectedCategory!]?.category}`}
        subTitle={data[selectedCategory!]?.description}
        children={modalContent}
        onClose={onModalClose}
      />
    </div>
  );
}
