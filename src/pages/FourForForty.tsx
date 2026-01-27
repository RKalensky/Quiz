import { useLoaderData } from "react-router";
import type { FourForForty } from "../types";
import { useMemo, useState } from "react";
import { AVAILABLE_LETTERS } from "../config/fourForForty.ts";

export default function FourForForty() {
  const data = useLoaderData() as FourForForty;
  const [selectedLetter, setSelectedLetter] = useState("");
  const [usedLetters, setUsedLetters] = useState<string[]>([]);

  const filteredLetters = useMemo(() => {
    return AVAILABLE_LETTERS.filter((letter) => !usedLetters.includes(letter));
  }, [usedLetters]);

  const getRandomLetter = () => {
    return filteredLetters[Math.floor(Math.random() * filteredLetters.length)];
  };

  const startGame = () => {
    let interval = 0;

    const startStamp = Date.now() + 2000;
    interval = setInterval(() => {
      const letter = getRandomLetter();
      setSelectedLetter(letter);

      if (startStamp < Date.now()) {
        clearInterval(interval);
        setUsedLetters((prev) => [...prev, letter]);
      }
    }, 30);
  };

  return (
    <div>
      <h1 className="!text-[60px] !mb-20">
        Чотири за сорок. Вам потрібно за 40 секунд написати чотири слова на
        певну літеру згідно категорій. В залік ідуть лише унікальні відповіді,
        тобто такі що не повторюються.
      </h1>

      <button className="" onClick={startGame}>
        Старт
      </button>

      <div className="flex gap-100 items-center h-100">
        <ul>
          {data.map((item, index) => (
            <li key={index} className="relative text-7xl mb-3">
              <span className="absolute">{index + 1}.</span>{" "}
              <span className="pl-20">{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-[400px] font-bold leading-[1]">{selectedLetter}</p>
      </div>
    </div>
  );
}
