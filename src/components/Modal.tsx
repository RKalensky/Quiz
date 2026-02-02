import type { ReactElement } from "react";

interface Props {
  isOpen: boolean;
  title: ReactElement | string;
  subTitle?: ReactElement | string;
  children: ReactElement | null;
  onClose: () => void;
}

const Modal = ({
  isOpen = false,
  title,
  subTitle,
  children,
  onClose,
}: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-10 p-10 flex flex-col border-2 border-white bg-gray-800 z-50">
      <div className="mb-20">
        <h1 className="mb-0!">{title}</h1>
        {subTitle ? (
          <h2 className="text-4xl mt-5 text-center text-blue-400">
            {subTitle}
          </h2>
        ) : null}
      </div>
      <div className="flex-1 justify-center content-center text-center">
        {children}
      </div>
      <button className="absolute top-5 right-5" onClick={onClose}>
        Close
      </button>
    </div>
  );
};

export default Modal;
